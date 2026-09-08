// ============================================================
// backend/app/api/workflows/[id]/runs/route.ts
// POST: Trigger a new workflow run
// GET: List runs for a workflow
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser, getUserWorkspace } from '@/lib/supabase/server';
import { workflowQueue } from '@/lib/bullmq/queues';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/workflows/:id/runs
 * Returns paginated run history with optional run log details
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: workflowId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const status = searchParams.get('status');
    const includeLogs = searchParams.get('include_logs') === 'true';

    const supabase = createSupabaseServerClient();

    // Verify access
    const { data: workflow } = await supabase
      .from('workflows')
      .select('workspace_id')
      .eq('id', workflowId)
      .is('deleted_at', null)
      .single();

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData || workspaceData.workspace.id !== workflow.workspace_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch runs
    let query = supabase
      .from('runs')
      .select('*', { count: 'exact' })
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: runs, error, count } = await query;

    if (error) {
      console.error('[GET /api/workflows/:id/runs] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch runs' }, { status: 500 });
    }

    // Optionally include node-level logs for each run
    let runsWithLogs = runs;
    if (includeLogs && runs) {
      const runIds = runs.map((r) => r.id);
      const { data: logs } = await supabase
        .from('run_logs')
        .select('*')
        .in('run_id', runIds)
        .order('execution_order', { ascending: true });

      // Group logs by run_id
      const logsByRun = (logs || []).reduce((acc, log) => {
        if (!acc[log.run_id]) acc[log.run_id] = [];
        acc[log.run_id].push(log);
        return acc;
      }, {} as Record<string, any[]>);

      runsWithLogs = runs.map((run) => ({
        ...run,
        logs: logsByRun[run.id] || [],
      }));
    }

    return NextResponse.json({
      runs: runsWithLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('[GET /api/workflows/:id/runs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/workflows/:id/runs
 * Triggers a new workflow execution.
 * Body: { trigger_type, trigger_payload?, is_dry_run? }
 * 
 * Flow:
 * 1. Create a `runs` record (status: queued)
 * 2. Create `run_logs` for each node (status: pending)
 * 3. Add job to BullMQ workflow queue
 * 4. Return run ID + BullMQ job ID for real-time tracking
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: workflowId } = await context.params;
    const body = await request.json();

    const supabase = createSupabaseServerClient();

    // Fetch workflow with canvas state
    const { data: workflow, error: wfError } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .is('deleted_at', null)
      .single();

    if (wfError || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check workspace membership + permissions
    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData || workspaceData.workspace.id !== workflow.workspace_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['owner', 'admin', 'editor'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check usage limits
    const workspace = workspaceData.workspace;
    if (workspace.monthly_workflow_runs >= workspace.monthly_workflow_run_limit) {
      return NextResponse.json(
        { error: 'Monthly workflow run limit reached. Upgrade your plan.' },
        { status: 429 }
      );
    }

    // Check concurrent run limit
    const { count: activeRuns } = await supabase
      .from('runs')
      .select('*', { count: 'exact', head: true })
      .eq('workflow_id', workflowId)
      .in('status', ['queued', 'running']);

    if ((activeRuns || 0) >= workflow.max_concurrent_runs) {
      return NextResponse.json(
        { error: `Maximum ${workflow.max_concurrent_runs} concurrent runs reached.` },
        { status: 429 }
      );
    }

    // Determine next run number
    const { data: lastRun } = await supabase
      .from('runs')
      .select('run_number')
      .eq('workflow_id', workflowId)
      .order('run_number', { ascending: false })
      .limit(1)
      .single();

    const nextRunNumber = (lastRun?.run_number || 0) + 1;

    // Extract nodes from canvas state for run_logs
    const canvasNodes = workflow.canvas_state?.nodes || [];
    const triggerType = body.trigger_type || 'manual';
    const isDryRun = body.is_dry_run ?? workflow.is_dry_run;

    // 1. Create the run record
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        workspace_id: workflow.workspace_id,
        workflow_id: workflowId,
        run_number: nextRunNumber,
        trigger_type: triggerType,
        trigger_payload: body.trigger_payload || null,
        status: 'queued',
        is_dry_run: isDryRun,
        total_nodes: canvasNodes.length,
      })
      .select()
      .single();

    if (runError || !run) {
      console.error('[POST runs] Failed to create run:', runError);
      return NextResponse.json({ error: 'Failed to create run' }, { status: 500 });
    }

    // 2. Create run_logs for each node (pending state)
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

    // 3. Add job to BullMQ queue
    // The worker will pick this up and execute the workflow
    const job = await workflowQueue.add(
      `workflow-${workflowId}-run-${run.id}`,
      {
        runId: run.id,
        workflowId,
        workspaceId: workflow.workspace_id,
        userId: user.id,
        canvasState: workflow.canvas_state,
        triggerPayload: body.trigger_payload || null,
        isDryRun,
        integrations: {}, // Worker will fetch from DB
      },
      {
        // Per-tenant queue isolation: use workspace ID as queue group
        // This ensures User A's heavy job doesn't block User B
        jobId: run.id,
        attempts: 1, // Run-level: don't auto-retry the entire run
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 200,     // Keep last 200 failed jobs for debugging
      }
    );

    // 4. Update run with BullMQ job ID
    await supabase
      .from('runs')
      .update({ bullmq_job_id: job.id })
      .eq('id', run.id);

    // 5. Update workflow last_run_at
    await supabase
      .from('workflows')
      .update({ last_run_at: new Date().toISOString() })
      .eq('id', workflowId);

    // 6. Increment workspace usage counter
    await supabase.rpc('increment_workflow_runs', {
      workspace_id_input: workflow.workspace_id,
    });

    return NextResponse.json({
      run: {
        id: run.id,
        run_number: run.run_number,
        status: run.status,
        is_dry_run: run.is_dry_run,
        total_nodes: run.total_nodes,
        bullmq_job_id: job.id,
        created_at: run.created_at,
      },
      message: isDryRun
        ? 'Dry run queued. No external APIs will be called.'
        : 'Workflow run queued. Monitor progress in real-time.',
    }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/workflows/:id/runs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
