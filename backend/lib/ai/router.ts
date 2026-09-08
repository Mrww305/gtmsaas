// ============================================================
// AI ROUTING LAYER
// Purpose: Route AI tasks to appropriate model (Claude vs GPT-4o-mini)
// Called by: workflow-executor.ts when processing AI nodes
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase/server'

interface AIRequest {
  task: string
  context: Record<string, any>
  model_preference?: 'claude' | 'gpt-4o-mini' | 'auto'
  max_tokens?: number
  temperature?: number
}

interface AIResponse {
  success: boolean
  provider: 'anthropic' | 'openai'
  model: string
  output: any
  tokens_used: {
    input: number
    output: number
    total: number
  }
  cost: number
  error?: string
}

// Cost per 1K tokens (as of 2026)
const COST_PER_1K_TOKENS = {
  'claude-3-5-sonnet': { input: 0.003, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
}

/**
 * AI Router
 * Automatically selects the best model based on task complexity
 * 
 * Routing Logic:
 * - Claude 3.5 Sonnet: Complex reasoning, long context, nuanced analysis
 * - GPT-4o-mini: Simple extraction, formatting, low-latency tasks
 */
export async function routeAIRequest(
  workspaceId: string,
  request: AIRequest
): Promise<AIResponse> {
  const supabase = createSupabaseAdminClient()

  // Get available AI integrations
  const { data: integrations } = await supabase
    .from('integrations')
    .select('id, provider, vault_key_id')
    .eq('workspace_id', workspaceId)
    .eq('category', 'ai')
    .eq('status', 'active')
    .in('provider', ['anthropic', 'openai'])

  if (!integrations || integrations.length === 0) {
    return {
      success: false,
      provider: 'openai',
      model: 'none',
      output: null,
      tokens_used: { input: 0, output: 0, total: 0 },
      cost: 0,
      error: 'No AI integrations configured',
    }
  }

  // Build provider map
  const providerMap = new Map(integrations.map(i => [i.provider, i]))

  // Determine which model to use
  const selectedModel = selectModel(request, providerMap)

  if (selectedModel === 'claude' && providerMap.has('anthropic')) {
    return await callClaude(providerMap.get('anthropic')!, request)
  }

  if (selectedModel === 'gpt-4o-mini' && providerMap.has('openai')) {
    return await callGPT4oMini(providerMap.get('openai')!, request)
  }

  // Fallback: try whichever is available
  if (providerMap.has('openai')) {
    return await callGPT4oMini(providerMap.get('openai')!, request)
  }

  if (providerMap.has('anthropic')) {
    return await callClaude(providerMap.get('anthropic')!, request)
  }

  return {
    success: false,
    provider: 'none',
    model: 'none',
    output: null,
    tokens_used: { input: 0, output: 0, total: 0 },
    cost: 0,
    error: 'No suitable AI provider available',
  }
}

/**
 * Model Selection Logic
 */
function selectModel(
  request: AIRequest,
  availableProviders: Map<string, any>
): 'claude' | 'gpt-4o-mini' {
  // User explicitly requested a model
  if (request.model_preference === 'claude' && availableProviders.has('anthropic')) {
    return 'claude'
  }
  if (request.model_preference === 'gpt-4o-mini' && availableProviders.has('openai')) {
    return 'gpt-4o-mini'
  }

  // Auto-routing based on task complexity
  const taskLower = request.task.toLowerCase()
  const contextSize = JSON.stringify(request.context).length

  // Use Claude for complex tasks
  const complexKeywords = [
    'analyze', 'reason', 'compare', 'evaluate', 'strategize',
    'synthesize', 'interpret', 'complex', 'nuanced', 'detailed'
  ]

  const isComplex = complexKeywords.some(keyword => taskLower.includes(keyword))
  const isLongContext = contextSize > 10000 // > 10KB of context

  if (isComplex || isLongContext) {
    if (availableProviders.has('anthropic')) {
      return 'claude'
    }
  }

  // Default to GPT-4o-mini for simple tasks (faster, cheaper)
  if (availableProviders.has('openai')) {
    return 'gpt-4o-mini'
  }

  // Fallback to Claude if GPT not available
  if (availableProviders.has('anthropic')) {
    return 'claude'
  }

  // Should never reach here if we have any providers
  return 'gpt-4o-mini'
}

/**
 * Claude 3.5 Sonnet API Call
 * Best for: Complex reasoning, long context, nuanced analysis
 */
async function callClaude(
  integration: { id: string; vault_key_id: string },
  request: AIRequest
): Promise<AIResponse> {
  try {
    const apiKey = await getVaultSecret(integration.vault_key_id)

    const systemPrompt = buildSystemPrompt(request.task)
    const userPrompt = buildUserPrompt(request.context)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature || 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    })

    if (response.status === 429) {
      return {
        success: false,
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
        output: null,
        tokens_used: { input: 0, output: 0, total: 0 },
        cost: 0,
        error: 'Rate limited (429)',
      }
    }

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        provider: 'anthropic',
        model: 'claude-3-5-sonnet',
        output: null,
        tokens_used: { input: 0, output: 0, total: 0 },
        cost: 0,
        error: errorData.error?.message || `HTTP ${response.status}`,
      }
    }

    const result = await response.json()

    const inputTokens = result.usage?.input_tokens || 0
    const outputTokens = result.usage?.output_tokens || 0
    const totalTokens = inputTokens + outputTokens

    const cost =
      (inputTokens / 1000) * COST_PER_1K_TOKENS['claude-3-5-sonnet'].input +
      (outputTokens / 1000) * COST_PER_1K_TOKENS['claude-3-5-sonnet'].output

    // Parse the output (try JSON first, fallback to text)
    let output = result.content[0]?.text || ''
    try {
      output = JSON.parse(output)
    } catch {
      // Not JSON, keep as string
    }

    return {
      success: true,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
      output,
      tokens_used: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost,
    }
  } catch (error) {
    return {
      success: false,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet',
      output: null,
      tokens_used: { input: 0, output: 0, total: 0 },
      cost: 0,
      error: error.message,
    }
  }
}

/**
 * GPT-4o-mini API Call
 * Best for: Simple extraction, formatting, low-latency tasks
 */
async function callGPT4oMini(
  integration: { id: string; vault_key_id: string },
  request: AIRequest
): Promise<AIResponse> {
  try {
    const apiKey = await getVaultSecret(integration.vault_key_id)

    const systemPrompt = buildSystemPrompt(request.task)
    const userPrompt = buildUserPrompt(request.context)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: request.max_tokens || 2048,
        temperature: request.temperature || 0.7,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (response.status === 429) {
      return {
        success: false,
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: null,
        tokens_used: { input: 0, output: 0, total: 0 },
        cost: 0,
        error: 'Rate limited (429)',
      }
    }

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        provider: 'openai',
        model: 'gpt-4o-mini',
        output: null,
        tokens_used: { input: 0, output: 0, total: 0 },
        cost: 0,
        error: errorData.error?.message || `HTTP ${response.status}`,
      }
    }

    const result = await response.json()

    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0
    const totalTokens = inputTokens + outputTokens

    const cost =
      (inputTokens / 1000) * COST_PER_1K_TOKENS['gpt-4o-mini'].input +
      (outputTokens / 1000) * COST_PER_1K_TOKENS['gpt-4o-mini'].output

    // Parse the output (should be JSON due to response_format)
    let output = result.choices[0]?.message?.content || ''
    try {
      output = JSON.parse(output)
    } catch {
      // Not JSON, keep as string
    }

    return {
      success: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      output,
      tokens_used: {
        input: inputTokens,
        output: outputTokens,
        total: totalTokens,
      },
      cost,
    }
  } catch (error) {
    return {
      success: false,
      provider: 'openai',
      model: 'gpt-4o-mini',
      output: null,
      tokens_used: { input: 0, output: 0, total: 0 },
      cost: 0,
      error: error.message,
    }
  }
}

/**
 * Build system prompt based on task
 */
function buildSystemPrompt(task: string): string {
  const taskLower = task.toLowerCase()

  if (taskLower.includes('pain point') || taskLower.includes('extract')) {
    return `You are an expert B2B sales analyst. Extract key pain points, challenges, and opportunities from the provided context. Be specific and actionable. Return your analysis as a JSON object with the following structure:
{
  "pain_points": ["list", "of", "pain", "points"],
  "opportunities": ["list", "of", "opportunities"],
  "recommended_approach": "brief description of how to approach this prospect"
}`
  }

  if (taskLower.includes('icebreaker') || taskLower.includes('personalize')) {
    return `You are an expert sales copywriter. Create a personalized, genuine icebreaker based on the provided context. Be conversational, not salesy. Reference specific details that show you've done your research. Return your response as a JSON object:
{
  "icebreaker": "The personalized opening line (1-2 sentences)",
  "personalization_points": ["specific details you referenced"],
  "tone": "casual|professional|enthusiastic"
}`
  }

  if (taskLower.includes('score') || taskLower.includes('grade') || taskLower.includes('tier')) {
    return `You are an expert lead qualification analyst. Score this lead based on the provided context. Consider: company size, role seniority, engagement signals, fit with typical ICP. Return your analysis as a JSON object:
{
  "score": "A|B|C|D|F",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of the score",
  "key_factors": ["list", "of", "factors", "that", "influenced", "the", "score"]
}`
  }

  // Default system prompt
  return `You are a helpful AI assistant. Analyze the provided context and return your response as a JSON object.`
}

/**
 * Build user prompt from context
 */
function buildUserPrompt(context: Record<string, any>): string {
  return `Here is the context to analyze:

${JSON.stringify(context, null, 2)}

Please analyze this data and provide your response.`
}

/**
 * Retrieve secret from Supabase Vault
 */
async function getVaultSecret(vaultKeyId: string): Promise<string> {
  const supabase = createSupabaseAdminClient()

  const { data, error } = await supabase.rpc('decrypt_vault_secret', {
    secret_id: vaultKeyId,
  })

  if (error || !data) {
    throw new Error('Failed to retrieve vault secret')
  }

  return data
}
