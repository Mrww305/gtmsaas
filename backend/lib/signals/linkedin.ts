// ============================================================
// LINKEDIN SIGNAL HARVESTER
// Purpose: Receive signals from Chrome extension and trigger workflows
// Called by: Chrome extension → webhook → this handler
// ============================================================

import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { workflowQueue } from '@/lib/bullmq/queues'

interface LinkedInSignal {
  type: 'job_change' | 'profile_view' | 'post_engagement' | 'connection' | 'company_update'
  actor: {
    name: string
    title: string
    linkedin_url: string
    profile_picture?: string
  }
  company?: {
    name: string
    domain?: string
    linkedin_url?: string
  }
  details: Record<string, any>
  timestamp: string
}

interface SignalProcessingResult {
  success: boolean
  workflows_triggered: number
  error?: string
}

/**
 * Process LinkedIn Signal
 * 1. Validate the signal
 * 2. Find matching workflows (by signal type)
 * 3. Trigger those workflows with the signal data
 */
export async function processLinkedInSignal(
  workspaceId: string,
  signal: LinkedInSignal
): Promise<SignalProcessingResult> {
  const supabase = createSupabaseAdminClient()

  try {
    // Validate signal
    if (!signal.type || !signal.actor || !signal.timestamp) {
      throw new Error('Invalid signal structure')
    }

    // Find workflows that listen for this signal type
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('id, name, canvas_state, trigger_config')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active')
      .eq('trigger_type', 'signal')

    if (error) {
      throw new Error('Failed to query workflows')
    }

    if (!workflows || workflows.length === 0) {
      return {
        success: true,
        workflows_triggered: 0,
      }
    }

    // Filter workflows that match this signal type
    const matchingWorkflows = workflows.filter(wf => {
      const triggerConfig = wf.trigger_config as any
      return triggerConfig?.signal_type === signal.type
    })

    if (matchingWorkflows.length === 0) {
      return {
        success: true,
        workflows_triggered: 0,
      }
    }

    // Trigger each matching workflow
    let triggeredCount = 0

    for (const workflow of matchingWorkflows) {
      try {
        // Create a run record
        const { data: run, error: runError } = await supabase
          .from('runs')
          .insert({
            workspace_id: workspaceId,
            workflow_id: workflow.id,
            run_number: await getNextRunNumber(supabase, workflow.id),
            trigger_type: 'signal',
            trigger_payload: signal,
            status: 'queued',
            is_dry_run: false,
            total_nodes: workflow.canvas_state?.nodes?.length || 0,
          })
          .select()
          .single()

        if (runError || !run) {
          console.error(`Failed to create run for workflow ${workflow.id}:`, runError)
          continue
        }

        // Create run_logs for each node
        const nodes = workflow.canvas_state?.nodes || []
        if (nodes.length > 0) {
          const nodeLogs = nodes.map((node: any, index: number) => ({
            run_id: run.id,
            workspace_id: workspaceId,
            node_id: node.id,
            node_type: node.data?.type || node.type || 'unknown',
            node_label: node.data?.label || `Node ${index + 1}`,
            status: 'pending' as const,
            execution_order: index,
          }))

          await supabase.from('run_logs').insert(nodeLogs)
        }

        // Add to BullMQ queue
        const job = await workflowQueue.add(
          `signal-${workflow.id}-run-${run.id}`,
          {
            runId: run.id,
            workflowId: workflow.id,
            workspaceId,
            canvasState: workflow.canvas_state,
            triggerPayload: signal,
            isDryRun: false,
          },
          {
            jobId: run.id,
            attempts: 1,
            removeOnComplete: 100,
            removeOnFail: 200,
          }
        )

        // Update run with job ID
        await supabase
          .from('runs')
          .update({ bullmq_job_id: job.id })
          .eq('id', run.id)

        // Increment workspace usage
        await supabase.rpc('increment_workflow_runs', {
          workspace_id_input: workspaceId,
        })

        triggeredCount++
      } catch (err) {
        console.error(`Failed to trigger workflow ${workflow.id}:`, err)
        // Continue with other workflows
      }
    }

    return {
      success: true,
      workflows_triggered: triggeredCount,
    }
  } catch (error) {
    return {
      success: false,
      workflows_triggered: 0,
      error: error.message,
    }
  }
}

/**
 * Get next run number for a workflow
 */
async function getNextRunNumber(supabase: any, workflowId: string): Promise<number> {
  const { data: lastRun } = await supabase
    .from('runs')
    .select('run_number')
    .eq('workflow_id', workflowId)
    .order('run_number', { ascending: false })
    .limit(1)
    .single()

  return (lastRun?.run_number || 0) + 1
}

/**
 * Signal Type Definitions
 * Used by Chrome extension to send structured signals
 */
export const SIGNAL_TYPES = {
  JOB_CHANGE: 'job_change',
  PROFILE_VIEW: 'profile_view',
  POST_ENGAGEMENT: 'post_engagement',
  CONNECTION: 'connection',
  COMPANY_UPDATE: 'company_update',
} as const

/**
 * Signal Validation Schema
 * Validates incoming signals from Chrome extension
 */
export function validateSignal(signal: any): signal is LinkedInSignal {
  if (!signal || typeof signal !== 'object') return false
  if (!signal.type || !Object.values(SIGNAL_TYPES).includes(signal.type)) return false
  if (!signal.actor || typeof signal.actor !== 'object') return false
  if (!signal.actor.name || !signal.actor.linkedin_url) return false
  if (!signal.timestamp) return false

  return true
}
