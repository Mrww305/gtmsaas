// ============================================================
// backend/app/api/webhooks/inbound/[workflowId]/route.ts
// POST: Receives inbound webhooks and triggers workflow runs
// 
// Each workflow gets a unique webhook URL:
// https://revflow.app/api/webhooks/inbound/{workflowId}
//
// This is the "Visual Webhook Catcher" feature.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { workflowQueue } from '@/lib/bullmq/queues';
import crypto from 'crypto';

type RouteContext = { params: Promise<{ workflowId: string }> };

/**
 * POST /api/webhooks/inbound/:workflowId
 * 
 * This endpoint is PUBLIC (no auth required) — it's called by external services.
 * Security: We validate the workflow exists and is active.
 * Optional: Webhook signature verification (configurable per workflow).
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { workflowId } = await context.params;

    // Parse the inbound payload
    let payload: any;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries());
    } else {
      // Try to parse as text/JSON
      const text = await request.text();
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { raw: text };
      }
    }

    // Use admin client (bypasses RLS) since this is a public endpoint
    const supabase = createSupabaseAdminClient();

    // Fetch the workflow
    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('id, workspace_id, canvas_state, trigger_config, status, is_dry_run, max_concurrent_runs')
      .eq('id', workflowId)
      .is('deleted_at', null)
      .single();

    if (error || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check workflow is active
    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: `Workflow is ${workflow.status}. Activate it to receive webhooks.` },
        { status: 422 }
      );
    }

    // Optional: Verify webhook signature
    const triggerConfig = workflow.trigger_config || {};
    if (triggerConfig.webhook_secret) {
      const signature = request.headers.get('x-revflow-signature') ||
                        request.headers.get('x-webhook-signature');

      if (!signature) {
        return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
      }

      const body = await request.clone().text();
      const expectedSignature = crypto
        .createHmac('sha256', triggerConfig.webhook_secret)
        .update(body)
        .digest('hex');

      if (!crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    // Check concurrent run limit
    const { count: activeRuns } = await supabase
      .from('runs')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', workflowId)
      .in('status', ['queued', 'running']);

    if ((activeRuns || 0) >= workflow.max_concurrent_runs) {
      // Don't fail — queue it and let the user know
      console.warn(`[Webhook] Workflow ${workflowId} at max concurrent runs. Queuing anyway.`);
    }

    // Get next run number
    const { data: lastRun } = await supabase
      .from('runs')
      .select('run_number')
      .eq('workflow_id', workflowId)
      .order('run_number', { ascending: false })
      .limit(1)
      .single();

    const nextRunNumber = (lastRun?.run_number || 0) + 1;

    // Extract nodes for run_logs
    const canvasNodes = workflow.canvas_state?.nodes || [];

    // Create run record
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        workspace_id: workflow.workspace_id,
        workflow_id: workflowId,
        run_number: nextRunNumber,
        trigger_type: 'webhook',
        trigger_payload: payload,
        status: 'queued',
        is_dry_run: workflow.is_dry_run,
        total_nodes: canvasNodes.length,
      })
      .select()
      .single();

    if (runError || !run) {
      console.error('[Webhook] Failed to create run:', runError);
      return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
    }

    // Create node-level run_logs
    const nodeLogs = canvasNodes.map((node: any, index: number) => ({
      run_id: run.id,
      workspace_id: workflow.workspace_id,
      node_id: node.id,
      node_type: node.data?.type || node.type || 'unknown',
      node_label: node.data?.label || `Node ${index + 1}`,
      status: 'pending' as const,
      execution_order: index,
    }));

    if (nodeLogs.length > 0) {
      await supabase.from('run_logs').insert(nodeLogs);
    }

    // Add to BullMQ queue
    const job = await workflowQueue.add(
      `webhook-${workflowId}-run-${run.id}`,
      {
        runId: run.id,
        workflowId,
        workspaceId: workflow.workspace_id,
        canvasState: workflow.canvas_state,
        triggerPayload: payload,
        isDryRun: workflow.is_dry_run,
      },
      {
        jobId: run.id,
        attempts: 1,
        removeOnComplete: 100,
        removeOnFail: 200,
      }
    );

    // Update run with job ID
    await supabase
      .from('runs')
      .update({ bullmq_job_id: job.id })
      .eq('id', run.id);

    // Increment workspace usage
    await supabase.rpc('increment_workflow_runs', {
      workspace_id_input: workflow.workspace_id,
    });

    // Return 202 Accepted (async processing)
    return NextResponse.json({
      run_id: run.id,
      run_number: run.run_number,
      status: 'queued',
      message: 'Webhook received. Workflow execution queued.',
    }, { status: 202 });
  } catch (err) {
    console.error('[POST /api/webhooks/inbound/:workflowId] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
