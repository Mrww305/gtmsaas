// ============================================================
// backend/lib/bullmq/workers/workflow-executor.ts
// 
// THE CORE ENGINE: Processes workflow runs from the queue.
// 
// For each job:
// 1. Parse the canvas state into a topological execution order
// 2. Execute each node sequentially (respecting edges)
// 3. Update run_logs in real-time (so frontend can show live status)
// 4. Handle errors with clean JSON states for the React Flow canvas
// 5. Track costs for metering
//
// This worker runs as a separate process (or multiple replicas).
// ============================================================

import { Worker, Job } from 'bullmq';
import { getRedisSubscriber } from '../queues';
import { createSupabaseAdminClient } from '../supabase/server';
import { enrichmentQueue, aiQueue, webhookQueue } from '../queues';

// ============================================================
// Types
// ============================================================

interface WorkflowJobData {
  runId: string;
  workflowId: string;
  workspaceId: string;
  userId?: string;
  canvasState: {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    viewport: any;
  };
  triggerPayload: Record<string, any> | null;
  isDryRun: boolean;
  integrations?: Record<string, any>;
}

interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label?: string;
    type?: string;       // 'trigger', 'enrich', 'ai', 'condition', 'delay', 'execute', 'alert'
    provider?: string;   // 'apollo', 'openai', 'smartlead', etc.
    config?: Record<string, any>;
  };
}

interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;  // For condition branches: 'yes' | 'no'
  targetHandle?: string;
}

interface NodeExecutionContext {
  inputData: Record<string, any>;
  previousOutputs: Record<string, any>;  // nodeId → output
  workspaceId: string;
  runId: string;
  isDryRun: boolean;
}

// ============================================================
// Error Codes (matches frontend ERROR_CODES)
// ============================================================

const ERROR_CODES = {
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  ENRICHMENT_NOT_FOUND: 'ENRICHMENT_NOT_FOUND',
  ENRICHMENT_PROVIDER_DOWN: 'ENRICHMENT_PROVIDER_DOWN',
  AI_TOKEN_LIMIT: 'AI_TOKEN_LIMIT',
  AI_EMPTY_RESPONSE: 'AI_EMPTY_RESPONSE',
  AI_SCHEMA_VIOLATION: 'AI_SCHEMA_VIOLATION',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',
  CRM_SYNC_FAILED: 'CRM_SYNC_FAILED',
  WORKFLOW_TIMEOUT: 'WORKFLOW_TIMEOUT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DRY_RUN_SKIPPED: 'DRY_RUN_SKIPPED',
} as const;

// ============================================================
// Worker Definition
// ============================================================

export const workflowExecutorWorker = new Worker<WorkflowJobData>(
  'revflow:workflows',
  async (job: Job<WorkflowJobData>) => {
    const { runId, workflowId, workspaceId, canvasState, triggerPayload, isDryRun } = job.data;
    const supabase = createSupabaseAdminClient();

    console.log(`[Worker] Starting run ${runId} for workflow ${workflowId}`);

    try {
      // ---- STEP 1: Mark run as running ----
      await supabase
        .from('runs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', runId);

      // ---- STEP 2: Build execution graph ----
      const executionOrder = buildExecutionOrder(canvasState.nodes, canvasState.edges);
      
      if (executionOrder.length === 0) {
        throw new Error('No executable nodes found in workflow');
      }

      // ---- STEP 3: Execute nodes in topological order ----
      const previousOutputs: Record<string, any> = {};
      let currentData: Record<string, any> = triggerPayload || {};
      let totalCost = 0;
      let successCount = 0;
      let failCount = 0;
      let hasFatalError = false;

      for (const { node, depth } of executionOrder) {
        // Skip if a fatal error occurred in a previous node
        if (hasFatalError) {
          await updateNodeLog(supabase, runId, workspaceId, node.id, {
            status: 'skipped',
            error_message: 'Skipped due to previous node failure',
          });
          continue;
        }

        // Mark node as running
        await updateNodeLog(supabase, runId, workspaceId, node.id, {
          status: 'running',
          started_at: new Date().toISOString(),
          input_data: currentData,
        });

        const startTime = Date.now();

        try {
          const context: NodeExecutionContext = {
            inputData: currentData,
            previousOutputs,
            workspaceId,
            runId,
            isDryRun,
          };

          // Execute the node based on its type
          const result = await executeNode(node, context, supabase);

          const duration = Date.now() - startTime;

          // Update node log with success
          await updateNodeLog(supabase, runId, workspaceId, node.id, {
            status: 'success',
            output_ result.output,
            completed_at: new Date().toISOString(),
            duration_ms: duration,
            cost_usd: result.cost || 0,
          });

          // Accumulate results
          previousOutputs[node.id] = result.output;
          currentData = { ...currentData, ...result.output };
          totalCost += result.cost || 0;
          successCount++;

        } catch (error: any) {
          const duration = Date.now() - startTime;
          
          // Build clean error object for frontend display
          const errorState = buildErrorState(error, node);

          // Update node log with error
          await updateNodeLog(supabase, runId, workspaceId, node.id, {
            status: 'failed',
            error_code: errorState.code,
            error_message: errorState.message,
            error_retryable: errorState.retryable,
            completed_at: new Date().toISOString(),
            duration_ms: duration,
          });

          failCount++;

          // If this is a non-recoverable error, skip remaining nodes
          if (!errorState.retryable) {
            hasFatalError = true;
          }
        }
      }

      // ---- STEP 4: Finalize run ----
      const finalStatus = hasFatalError ? 'failed' : 'completed';

      await supabase
        .from('runs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          total_cost_usd: totalCost,
          successful_nodes: successCount,
          failed_nodes: failCount,
          error_summary: hasFatalError ? 'One or more nodes failed. Check individual node logs.' : null,
        })
        .eq('id', runId);

      // Increment enrichment counter if applicable
      if (totalCost > 0) {
        await supabase.rpc('increment_enrichment_count', {
          workspace_id_input: workspaceId,
          count_input: successCount,
        });
      }

      console.log(`[Worker] Run ${runId} ${finalStatus}. Cost: $${totalCost.toFixed(4)}`);

      return { runId, status: finalStatus, totalCost, successCount, failCount };

    } catch (error: any) {
      // Fatal error — mark run as failed
      console.error(`[Worker] Fatal error in run ${runId}:`, error);

      await supabase
        .from('runs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_summary: error.message || 'Unexpected error during workflow execution',
        })
        .eq('id', runId);

      throw error; // Let BullMQ handle retry/failure
    }
  },
  {
    connection: getRedisSubscriber(),
    concurrency: 10, // Process 10 workflows simultaneously
    limiter: {
      max: 100,      // Max 100 jobs per...
      duration: 1000, // ...1000ms (1 second)
    },
  }
);

// ============================================================
// Node Executor (dispatches to specific handlers)
// ============================================================

async function executeNode(
  node: CanvasNode,
  context: NodeExecutionContext,
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<{ output: Record<string, any>; cost?: number }> {
  const nodeType = node.data.type || node.type;

  // DRY RUN: Don't execute anything, just simulate
  if (context.isDryRun && nodeType !== 'trigger') {
    return {
      output: { _dryRun: true, _nodeId: node.id, _nodeType: nodeType },
      cost: 0,
    };
  }

  switch (nodeType) {
    case 'trigger':
      return executeTriggerNode(node, context);
    
    case 'enrich':
      return executeEnrichmentNode(node, context, supabase);
    
    case 'ai':
      return executeAINode(node, context, supabase);
    
    case 'condition':
      return executeConditionNode(node, context);
    
    case 'delay':
      return executeDelayNode(node, context);
    
    case 'execute':
    case 'webhook':
      return executeWebhookNode(node, context, supabase);
    
    case 'alert':
      return executeAlertNode(node, context, supabase);
    
    case 'filter':
      return executeFilterNode(node, context);
    
    case 'split':
      return executeSplitNode(node, context);
    
    default:
      throw buildNodeError(
        `Unknown node type: ${nodeType}`,
        ERROR_CODES.INTERNAL_ERROR,
        false
      );
  }
}

// ============================================================
// Individual Node Handlers
// ============================================================

async function executeTriggerNode(
  node: CanvasNode,
  context: NodeExecutionContext
): Promise<{ output: Record<string, any> }> {
  // Trigger node just passes through the inbound payload
  return { output: context.inputData };
}

async function executeEnrichmentNode(
  node: CanvasNode,
  context: NodeExecutionContext,
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<{ output: Record<string, any>; cost: number }> {
  const provider = node.data.provider || 'apollo';
  const config = node.data.config || {};

  // Fetch the integration's vault key
  const { data: integration } = await supabase
    .from('integrations')
    .select('vault_key_id, provider, status')
    .eq('workspace_id', context.workspaceId)
    .eq('provider', provider)
    .eq('status', 'active')
    .single();

  if (!integration) {
    throw buildNodeError(
      `No active ${provider} integration found. Add your API key in Settings.`,
      ERROR_CODES.INVALID_API_KEY,
      false
    );
  }

  // Retrieve the actual API key from Vault
  const { data: vaultData } = await supabase
    .from('vault_decrypted_secrets' as any)
    .select('decrypted_secret')
    .eq('id', integration.vault_key_id)
    .single();

  if (!vaultData) {
    throw buildNodeError(
      'Failed to retrieve API key from secure vault.',
      ERROR_CODES.INTERNAL_ERROR,
      false
    );
  }

  const apiKey = JSON.parse(vaultData.decrypted_secret).api_key;

  // Execute enrichment based on provider
  switch (provider) {
    case 'apollo':
      return await callApolloEnrichment(apiKey, context.inputData, config);
    case 'clearbit':
      return await callClearbitEnrichment(apiKey, context.inputData, config);
    default:
      throw buildNodeError(
        `Unsupported enrichment provider: ${provider}`,
        ERROR_CODES.INTERNAL_ERROR,
        false
      );
  }
}

async function executeAINode(
  node: CanvasNode,
  context: NodeExecutionContext,
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<{ output: Record<string, any>; cost: number }> {
  const provider = node.data.provider || 'openai';
  const config = node.data.config || {};
  const model = config.model || (provider === 'openai' ? 'gpt-4o-mini' : 'claude-3-5-sonnet');

  // Fetch integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('vault_key_id')
    .eq('workspace_id', context.workspaceId)
    .eq('provider', provider)
    .eq('status', 'active')
    .single();

  if (!integration) {
    throw buildNodeError(
      `No active ${provider} integration. Add your API key in Settings.`,
      ERROR_CODES.INVALID_API_KEY,
      false
    );
  }

  // Get API key from vault
  const { data: vaultData } = await supabase
    .from('vault_decrypted_secrets' as any)
    .select('decrypted_secret')
    .eq('id', integration.vault_key_id)
    .single();

  const apiKey = JSON.parse(vaultData.decrypted_secret).api_key;

  // Build prompt from node config + input data
  const promptTemplate = config.prompt || config.prompt_template || '';
  const systemPrompt = config.system_prompt || '';
  const jsonSchema = config.json_schema;

  // Replace template variables with input data
  const prompt = replaceTemplateVars(promptTemplate, {
    ...context.inputData,
    ...context.previousOutputs,
  });

  // Call AI provider
  if (provider === 'openai') {
    return await callOpenAI(apiKey, model, prompt, systemPrompt, jsonSchema, config.max_tokens || 1000);
  } else if (provider === 'anthropic') {
    return await callAnthropic(apiKey, model, prompt, systemPrompt, jsonSchema, config.max_tokens || 1000);
  }

  throw buildNodeError(`Unsupported AI provider: ${provider}`, ERROR_CODES.INTERNAL_ERROR, false);
}

async function executeConditionNode(
  node: CanvasNode,
  context: NodeExecutionContext
): Promise<{ output: Record<string, any> }> {
  const config = node.data.config || {};
  const condition = config.condition; // e.g., { field: 'score', operator: 'gte', value: 'B' }

  if (!condition) {
    throw buildNodeError('Condition node missing configuration', ERROR_CODES.INTERNAL_ERROR, false);
  }

  const fieldValue = getNestedValue(context.inputData, condition.field);
  let result = false;

  switch (condition.operator) {
    case 'eq': result = fieldValue == condition.value; break;
    case 'neq': result = fieldValue != condition.value; break;
    case 'gt': result = Number(fieldValue) > Number(condition.value); break;
    case 'gte': result = Number(fieldValue) >= Number(condition.value); break;
    case 'lt': result = Number(fieldValue) < Number(condition.value); break;
    case 'lte': result = Number(fieldValue) <= Number(condition.value); break;
    case 'contains': result = String(fieldValue).includes(condition.value); break;
    case 'exists': result = fieldValue !== null && fieldValue !== undefined; break;
    default:
      throw buildNodeError(`Unknown operator: ${condition.operator}`, ERROR_CODES.INTERNAL_ERROR, false);
  }

  return { output: { _conditionResult: result, _branch: result ? 'yes' : 'no' } };
}

async function executeDelayNode(
  node: CanvasNode,
  _context: NodeExecutionContext
): Promise<{ output: Record<string, any> }> {
  const config = node.data.config || {};
  const delayMs = (config.duration || 1) * (config.unit === 'hours' ? 3600000 : config.unit === 'minutes' ? 60000 : 1000);

  // In production, this should create a delayed BullMQ job instead of blocking
  // For MVP, we'll just wait (not ideal but functional)
  // TODO: Implement delayed job pattern for production
  await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 30000))); // Cap at 30s for MVP

  return { output: { _delayed: true, _delayMs: delayMs } };
}

async function executeWebhookNode(
  node: CanvasNode,
  context: NodeExecutionContext,
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<{ output: Record<string, any>; cost: number }> {
  const provider = node.data.provider || 'smartlead';
  const config = node.data.config || {};

  // Fetch integration
  const { data: integration } = await supabase
    .from('integrations')
    .select('vault_key_id')
    .eq('workspace_id', context.workspaceId)
    .eq('provider', provider)
    .eq('status', 'active')
    .single();

  if (!integration) {
    throw buildNodeError(
      `No active ${provider} integration. Connect your account in Settings.`,
      ERROR_CODES.INVALID_API_KEY,
      false
    );
  }

  // Get API key
  const { data: vaultData } = await supabase
    .from('vault_decrypted_secrets' as any)
    .select('decrypted_secret')
    .eq('id', integration.vault_key_id)
    .single();

  const apiKey = JSON.parse(vaultData.decrypted_secret).api_key;

  // Push to Smartlead/Instantly
  if (provider === 'smartlead') {
    return await pushToSmartlead(apiKey, context.inputData, config);
  } else if (provider === 'instantly') {
    return await pushToInstantly(apiKey, context.inputData, config);
  }

  throw buildNodeError(`Unsupported execution provider: ${provider}`, ERROR_CODES.INTERNAL_ERROR, false);
}

async function executeAlertNode(
  node: CanvasNode,
  context: NodeExecutionContext,
  supabase: ReturnType<typeof createSupabaseAdminClient>
): Promise<{ output: Record<string, any> }> {
  const provider = node.data.provider || 'slack';
  const config = node.data.config || {};

  const { data: integration } = await supabase
    .from('integrations')
    .select('vault_key_id')
    .eq('workspace_id', context.workspaceId)
    .eq('provider', provider)
    .eq('status', 'active')
    .single();

  if (!integration) {
    throw buildNodeError(`No active ${provider} integration.`, ERROR_CODES.INVALID_API_KEY, false);
  }

  const { data: vaultData } = await supabase
    .from('vault_decrypted_secrets' as any)
    .select('decrypted_secret')
    .eq('id', integration.vault_key_id)
    .single();

  const webhookUrl = JSON.parse(vaultData.decrypted_secret).webhook_url;
  const messageTemplate = config.message || 'New lead: {{email}} from {{company}}';
  const message = replaceTemplateVars(messageTemplate, context.inputData);

  // Send to Slack/Discord
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: provider === 'slack'
      ? JSON.stringify({ text: message })
      : JSON.stringify({ content: message }),
  });

  if (!response.ok) {
    throw buildNodeError(
      `Failed to send ${provider} alert: ${response.statusText}`,
      ERROR_CODES.WEBHOOK_DELIVERY_FAILED,
      true
    );
  }

  return { output: { _alertSent: true, _provider: provider } };
}

async function executeFilterNode(
  node: CanvasNode,
  context: NodeExecutionContext
): Promise<{ output: Record<string, any> }> {
  const config = node.data.config || {};
  const filters = config.filters || [];

  let passes = true;
  for (const filter of filters) {
    const value = getNestedValue(context.inputData, filter.field);
    switch (filter.operator) {
      case 'eq': if (value != filter.value) passes = false; break;
      case 'neq': if (value == filter.value) passes = false; break;
      case 'exists': if (value === null || value === undefined) passes = false; break;
      case 'not_empty': if (!value) passes = false; break;
    }
    if (!passes) break;
  }

  if (!passes) {
    throw buildNodeError('Record filtered out', 'FILTERED', false);
  }

  return { output: context.inputData };
}

async function executeSplitNode(
  node: CanvasNode,
  context: NodeExecutionContext
): Promise<{ output: Record<string, any> }> {
  const config = node.data.config || {};
  const splitField = config.field || 'email';
  const splitCount = config.count || 2;

  // Simple hash-based splitting for A/B testing
  const value = String(context.inputData[splitField] || '');
  const hash = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const bucket = hash % splitCount;

  return { output: { ...context.inputData, _splitBucket: bucket } };
}

// ============================================================
// External API Callers (with rate limit handling)
// ============================================================

async function callApolloEnrichment(
  apiKey: string,
  inputData: Record<string, any>,
  config: Record<string, any>
): Promise<{ output: Record<string, any>; cost: number }> {
  const email = inputData.email;
  const domain = inputData.domain;

  if (!email && !domain) {
    throw buildNodeError('No email or domain provided for enrichment', ERROR_CODES.ENRICHMENT_NOT_FOUND, false);
  }

  const response = await fetch('https://api.apollo.io/v1/mixed_people/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      q_keywords: email || undefined,
      person_titles: config.titles || undefined,
      page: 1,
      per_page: 1,
    }),
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('retry-after') || '60');
    throw buildNodeError(
      `Apollo rate limit hit. Retry after ${retryAfter}s.`,
      ERROR_CODES.RATE_LIMITED,
      true
    );
  }

  if (response.status === 401) {
    throw buildNodeError('Invalid Apollo API key', ERROR_CODES.INVALID_API_KEY, false);
  }

  if (!response.ok) {
    throw buildNodeError(
      `Apollo API error: ${response.statusText}`,
      ERROR_CODES.ENRICHMENT_PROVIDER_DOWN,
      true
    );
  }

  const data = await response.json();
  const person = data.people?.[0];

  if (!person) {
    throw buildNodeError('No results found in Apollo', ERROR_CODES.ENRICHMENT_NOT_FOUND, false);
  }

  return {
    output: {
      enriched_name: person.name,
      enriched_title: person.title,
      enriched_company: person.organization_name,
      enriched_email: person.email,
      enriched_linkedin: person.linkedin_url,
      enriched_phone: person.phone_numbers?.[0]?.sanitized_number,
      enriched_location: person.city + (person.state ? `, ${person.state}` : ''),
      enriched_industry: person.organization_industry,
      enriched_employee_count: person.organization_num_employees,
      enriched_technologies: person.technology_names,
      _enrichmentSource: 'apollo',
    },
    cost: 0.01, // ~$0.01 per Apollo credit
  };
}

async function callClearbitEnrichment(
  apiKey: string,
  inputData: Record<string, any>,
  _config: Record<string, any>
): Promise<{ output: Record<string, any>; cost: number }> {
  const email = inputData.email;
  if (!email) {
    throw buildNodeError('Email required for Clearbit enrichment', ERROR_CODES.ENRICHMENT_NOT_FOUND, false);
  }

  const response = await fetch(`https://person.clearbit.com/v2/people/find?email=${encodeURIComponent(email)}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (response.status === 429) {
    throw buildNodeError('Clearbit rate limit hit', ERROR_CODES.RATE_LIMITED, true);
  }
  if (response.status === 401) {
    throw buildNodeError('Invalid Clearbit API key', ERROR_CODES.INVALID_API_KEY, false);
  }
  if (response.status === 404) {
    throw buildNodeError('Person not found in Clearbit', ERROR_CODES.ENRICHMENT_NOT_FOUND, false);
  }
  if (!response.ok) {
    throw buildNodeError(`Clearbit error: ${response.statusText}`, ERROR_CODES.ENRICHMENT_PROVIDER_DOWN, true);
  }

  const data = await response.json();

  return {
    output: {
      enriched_name: `${data.person?.firstName || ''} ${data.person?.lastName || ''}`.trim(),
      enriched_title: data.person?.employment?.title,
      enriched_company: data.person?.employment?.name,
      enriched_linkedin: data.person?.linkedin_url,
      enriched_industry: data.company?.category?.industry,
      enriched_employee_count: data.company?.metrics?.employees,
      enriched_funding: data.company?.funding?.total,
      enriched_technologies: data.company?.tech,
      _enrichmentSource: 'clearbit',
    },
    cost: 0.05, // ~$0.05 per Clearbit person lookup
  };
}

async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt: string,
  jsonSchema: Record<string, any> | undefined,
  maxTokens: number
): Promise<{ output: Record<string, any>; cost: number }> {
  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });

  const body: any = { model, messages, max_tokens: maxTokens };

  // JSON schema enforcement
  if (jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: 'output', schema: jsonSchema, strict: true },
    };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    throw buildNodeError('OpenAI rate limit hit', ERROR_CODES.RATE_LIMITED, true);
  }
  if (response.status === 401) {
    throw buildNodeError('Invalid OpenAI API key', ERROR_CODES.INVALID_API_KEY, false);
  }
  if (!response.ok) {
    throw buildNodeError(`OpenAI error: ${response.statusText}`, ERROR_CODES.AI_TOKEN_LIMIT, true);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw buildNodeError('OpenAI returned empty response', ERROR_CODES.AI_EMPTY_RESPONSE, true);
  }

  // Parse JSON output
  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw buildNodeError(
      'AI output is not valid JSON. Check your prompt template.',
      ERROR_CODES.AI_SCHEMA_VIOLATION,
      true
    );
  }

  // Calculate cost
  const inputTokens = data.usage?.prompt_tokens || 0;
  const outputTokens = data.usage?.completion_tokens || 0;
  const cost = calculateOpenAICost(model, inputTokens, outputTokens);

  return { output: { ai_result: parsed, _model: model, _tokens: { input: inputTokens, output: outputTokens } }, cost };
}

async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt: string,
  jsonSchema: Record<string, any> | undefined,
  maxTokens: number
): Promise<{ output: Record<string, any>; cost: number }> {
  const body: any = {
    model,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (systemPrompt) body.system = systemPrompt;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (response.status === 429) {
    throw buildNodeError('Anthropic rate limit hit', ERROR_CODES.RATE_LIMITED, true);
  }
  if (response.status === 401) {
    throw buildNodeError('Invalid Anthropic API key', ERROR_CODES.INVALID_API_KEY, false);
  }
  if (!response.ok) {
    throw buildNodeError(`Anthropic error: ${response.statusText}`, ERROR_CODES.AI_TOKEN_LIMIT, true);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw buildNodeError('Anthropic returned empty response', ERROR_CODES.AI_EMPTY_RESPONSE, true);
  }

  let parsed: Record<string, any>;
  try {
    parsed = JSON.parse(content);
  } catch {
    // If JSON schema was expected, this is an error
    if (jsonSchema) {
      throw buildNodeError('Anthropic output is not valid JSON', ERROR_CODES.AI_SCHEMA_VIOLATION, true);
    }
    parsed = { text: content };
  }

  const inputTokens = data.usage?.input_tokens || 0;
  const outputTokens = data.usage?.output_tokens || 0;
  const cost = calculateAnthropicCost(model, inputTokens, outputTokens);

  return { output: { ai_result: parsed, _model: model, _tokens: { input: inputTokens, output: outputTokens } }, cost };
}

async function pushToSmartlead(
  apiKey: string,
  inputData: Record<string, any>,
  config: Record<string, any>
): Promise<{ output: Record<string, any>; cost: number }> {
  const campaignId = config.campaign_id;
  if (!campaignId) {
    throw buildNodeError('Smartlead campaign ID required in node config', ERROR_CODES.INTERNAL_ERROR, false);
  }

  const response = await fetch(`https://server.smartlead.ai/api/v1/campaigns/${campaignId}/lead/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      lead_list: [{
        email: inputData.enriched_email || inputData.email,
        first_name: inputData.enriched_name?.split(' ')[0] || inputData.first_name,
        last_name: inputData.enriched_name?.split(' ').slice(1).join(' ') || inputData.last_name,
        company_name: inputData.enriched_company || inputData.company_name,
        phone: inputData.enriched_phone,
        linkedin_url: inputData.enriched_linkedin || inputData.linkedin_url,
        // Pass all other enriched fields as custom fields
        ...Object.fromEntries(
          Object.entries(inputData)
            .filter(([key]) => key.startsWith('enriched_'))
            .map(([key, val]) => [key.replace('enriched_', ''), val])
        ),
      }],
    }),
  });

  if (!response.ok) {
    throw buildNodeError(
      `Smartlead API error: ${response.statusText}`,
      ERROR_CODES.WEBHOOK_DELIVERY_FAILED,
      true
    );
  }

  return { output: { _pushedTo: 'smartlead', _campaignId: campaignId }, cost: 0 };
}

async function pushToInstantly(
  apiKey: string,
  inputData: Record<string, any>,
  config: Record<string, any>
): Promise<{ output: Record<string, any>; cost: number }> {
  const campaignId = config.campaign_id;
  if (!campaignId) {
    throw buildNodeError('Instantly campaign ID required', ERROR_CODES.INTERNAL_ERROR, false);
  }

  const response = await fetch('https://api.instantly.ai/api/v1/contacts/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      campaign_id: campaignId,
      contacts: [{
        email: inputData.enriched_email || inputData.email,
        first_name: inputData.enriched_name?.split(' ')[0],
        last_name: inputData.enriched_name?.split(' ').slice(1).join(' '),
        company: inputData.enriched_company || inputData.company_name,
      }],
    }),
  });

  if (!response.ok) {
    throw buildNodeError(
      `Instantly API error: ${response.statusText}`,
      ERROR_CODES.WEBHOOK_DELIVERY_FAILED,
      true
    );
  }

  return { output: { _pushedTo: 'instantly', _campaignId: campaignId }, cost: 0 };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Builds a topological execution order from the canvas graph.
 * Uses Kahn's algorithm for topological sorting.
 */
function buildExecutionOrder(
  nodes: CanvasNode[],
  edges: CanvasEdge[]
): { node: CanvasNode; depth: number }[] {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Build adjacency list
  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // BFS topological sort
  const queue: string[] = [];
  for (const [nodeId, degree] of inDegree) {
    if (degree === 0) queue.push(nodeId);
  }

  const result: { node: CanvasNode; depth: number }[] = [];
  const depthMap = new Map<string, number>();

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const depth = depthMap.get(nodeId) || 0;
    result.push({ node, depth });

    for (const neighbor of (adjacency.get(nodeId) || [])) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      depthMap.set(neighbor, Math.max(depthMap.get(neighbor) || 0, depth + 1));
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  return result;
}

/**
 * Updates a run_log record in Supabase (real-time for frontend)
 */
async function updateNodeLog(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  runId: string,
  workspaceId: string,
  nodeId: string,
  updates: Record<string, any>
) {
  await supabase
    .from('run_logs')
    .update(updates)
    .eq('run_id', runId)
    .eq('node_id', nodeId);
}

/**
 * Builds a standardized error object for frontend display
 */
function buildErrorState(error: any, node: CanvasNode) {
  if (error.code && error.message) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable || false,
    };
  }

  return {
    code: ERROR_CODES.INTERNAL_ERROR,
    message: error.message || 'Unknown error occurred',
    retryable: false,
  };
}

function buildNodeError(message: string, code: string, retryable: boolean) {
  const error = new Error(message) as any;
  error.code = code;
  error.retryable = retryable;
  return error;
}

/**
 * Replace {{variable}} placeholders in templates with data values
 */
function replaceTemplateVars(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Get a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Cost calculation helpers
 */
function calculateOpenAICost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'o1-mini': { input: 3, output: 12 },
  };
  const rates = pricing[model] || { input: 1, output: 5 };
  return ((inputTokens / 1_000_000) * rates.input) + ((outputTokens / 1_000_000) * rates.output);
}

function calculateAnthropicCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  };
  const rates = pricing[model] || { input: 1, output: 5 };
  return ((inputTokens / 1_000_000) * rates.input) + ((outputTokens / 1_000_000) * rates.output);
}

// ============================================================
// Worker Event Handlers
// ============================================================

workflowExecutorWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

workflowExecutorWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message);
});

workflowExecutorWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

export default workflowExecutorWorker;
