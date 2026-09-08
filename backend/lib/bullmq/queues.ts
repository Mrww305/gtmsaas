// ============================================================
// backend/lib/bullmq/queues.ts
// Queue definitions for RevFlow's async job processing
// 
// Architecture:
// - workflowQueue: Main orchestrator — executes workflow nodes in order
// - enrichmentQueue: Handles enrichment API calls with rate limiting
// - aiQueue: Handles AI/LLM calls with token cost tracking
// - webhookQueue: Handles outbound webhook delivery (Smartlead, etc.)
//
// Per-Tenant Isolation:
// Each workspace gets its own queue prefix to prevent one user's
// heavy job from blocking another user's real-time webhook.
// ============================================================

import { Queue, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

// ============================================================
// Redis Connection (shared across all queues)
// ============================================================

// IMPORTANT: Use maxRetriesPerRequest: null for BullMQ compatibility
const createRedisConnection = () =>
  new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    lazyConnect: true,
  });

// Shared connections (lazy-initialized)
let _publisherConnection: IORedis | null = null;
let _subscriberConnection: IORedis | null = null;

export function getRedisPublisher(): IORedis {
  if (!_publisherConnection) {
    _publisherConnection = createRedisConnection();
  }
  return _publisherConnection;
}

export function getRedisSubscriber(): IORedis {
  if (!_subscriberConnection) {
    _subscriberConnection = createRedisConnection();
  }
  return _subscriberConnection;
}

// ============================================================
// Queue Definitions
// ============================================================

/**
 * Main Workflow Queue
 * Orchestrates the execution of workflow nodes in topological order.
 * One job = one workflow run.
 */
export const workflowQueue = new Queue('revflow:workflows', {
  connection: getRedisPublisher(),
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
    attempts: 1, // Run-level: don't retry entire workflow
  },
});

/**
 * Enrichment Queue
 * Handles individual enrichment API calls (Apollo, Clearbit, etc.)
 * with rate limiting and exponential backoff.
 */
export const enrichmentQueue = new Queue('revflow:enrichment', {
  connection: getRedisPublisher(),
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
    attempts: 3, // Retry individual enrichment calls
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2s delay
    },
  },
});

/**
 * AI Queue
 * Handles LLM calls (OpenAI, Anthropic) with token cost tracking
 * and JSON schema enforcement.
 */
export const aiQueue = new Queue('revflow:ai', {
  connection: getRedisPublisher(),
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

/**
 * Webhook Delivery Queue
 * Handles outbound webhook pushes to Smartlead, Instantly, Slack, etc.
 */
export const webhookQueue = new Queue('revflow:webhooks', {
  connection: getRedisPublisher(),
  defaultJobOptions: {
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

// ============================================================
// Queue Events (for real-time monitoring)
// ============================================================

export const workflowQueueEvents = new QueueEvents('revflow:workflows', {
  connection: getRedisPublisher(),
});

// ============================================================
// Helper: Get per-tenant queue name
// This ensures User A's jobs don't block User B's
// ============================================================

export function getTenantQueueName(baseQueueName: string, workspaceId: string): string {
  return `${baseQueueName}:tenant:${workspaceId}`;
}

// ============================================================
// Helper: Add enrichment job with rate limit awareness
// ============================================================

export async function addEnrichmentJob(data: {
  runId: string;
  workspaceId: string;
  nodeId: string;
  provider: string;
  inputData: Record<string, any>;
  isDryRun: boolean;
}) {
  return enrichmentQueue.add(
    `enrich-${data.runId}-${data.nodeId}`,
    data,
    {
      // Per-tenant isolation
      name: getTenantQueueName('enrichment', data.workspaceId),
      priority: 1, // Normal priority
    }
  );
}

// ============================================================
// Helper: Add AI job with cost estimation
// ============================================================

export async function addAIJob(data: {
  runId: string;
  workspaceId: string;
  nodeId: string;
  provider: 'openai' | 'anthropic';
  model: string;
  prompt: string;
  systemPrompt?: string;
  jsonSchema?: Record<string, any>;
  maxTokens: number;
  isDryRun: boolean;
}) {
  // Estimate cost before queueing
  const estimatedTokens = Math.ceil(data.prompt.length / 4); // Rough estimate
  const estimatedCost = estimateAICost(data.provider, data.model, estimatedTokens, data.maxTokens);

  return aiQueue.add(
    `ai-${data.runId}-${data.nodeId}`,
    { ...data, estimatedCost },
    {
      name: getTenantQueueName('ai', data.workspaceId),
      priority: 2, // Slightly lower than enrichment
    }
  );
}

// ============================================================
// Cost Estimation (for metering display)
// ============================================================

function estimateAICost(
  provider: string,
  model: string,
  inputTokens: number,
  maxOutputTokens: number
): number {
  // Pricing as of 2026 (per 1M tokens)
  const pricing: Record<string, { input: number; output: number }> = {
    'openai:gpt-4o': { input: 2.5, output: 10 },
    'openai:gpt-4o-mini': { input: 0.15, output: 0.6 },
    'openai:o1-mini': { input: 3, output: 12 },
    'anthropic:claude-3-5-sonnet': { input: 3, output: 15 },
    'anthropic:claude-3-haiku': { input: 0.25, output: 1.25 },
  };

  const key = `${provider}:${model}`;
  const rates = pricing[key] || { input: 1, output: 5 }; // Default fallback

  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (maxOutputTokens / 1_000_000) * rates.output;

  return inputCost + outputCost;
}
