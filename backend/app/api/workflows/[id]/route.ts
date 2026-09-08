// ============================================================
// backend/app/api/workflows/[id]/route.ts
// GET: Single workflow with canvas state
// PATCH: Update workflow (canvas state, name, status)
// DELETE: Soft-delete workflow
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser, getUserWorkspace } from '@/lib/supabase/server';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/workflows/:id
 * Returns full workflow including canvas_state (React Flow JSON)
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const supabase = createSupabaseServerClient();

    const { data: workflow, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error || !workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // RLS will handle permission check, but verify workspace membership
    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData || workspaceData.workspace.id !== workflow.workspace_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch latest version info
    const { data: latestVersion } = await supabase
      .from('workflow_versions')
      .select('version_number, created_at, change_summary')
      .eq('workflow_id', id)
      .order('version_number', { ascending: false })
      .limit(1)
      .single();

    // Fetch recent runs (last 10)
    const { data: recentRuns } = await supabase
      .from('runs')
      .select('id, run_number, status, is_dry_run, total_cost_usd, created_at, completed_at')
      .eq('workflow_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      workflow,
      latest_version: latestVersion,
      recent_runs: recentRuns || [],
    });
  } catch (err) {
    console.error('[GET /api/workflows/:id] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/workflows/:id
 * Updates workflow fields. Creates a new version if canvas_state changed.
 * Body can include: { name?, description?, emoji?, canvas_state?, status?, trigger_type?, trigger_config? }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const body = await request.json();

    const supabase = createSupabaseServerClient();

    // Get current workflow
    const { data: current, error: fetchError } = await supabase
      .from('workflows')
      .select('canvas_state, current_version, workspace_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (fetchError || !current) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check workspace membership
    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData || workspaceData.workspace.id !== current.workspace_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['owner', 'admin', 'editor'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Build update payload (only include provided fields)
    const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.description !== undefined) updatePayload.description = body.description?.trim() || null;
    if (body.emoji !== undefined) updatePayload.emoji = body.emoji;
    if (body.status !== undefined) updatePayload.status = body.status;
    if (body.trigger_type !== undefined) updatePayload.trigger_type = body.trigger_type;
    if (body.trigger_config !== undefined) updatePayload.trigger_config = body.trigger_config;
    if (body.is_dry_run !== undefined) updatePayload.is_dry_run = body.is_dry_run;

    // If canvas_state changed, bump version
    if (body.canvas_state) {
      updatePayload.canvas_state = body.canvas_state;
      updatePayload.current_version = current.current_version + 1;

      // Save version snapshot
      await supabase.from('workflow_versions').insert({
        workflow_id: id,
        version_number: current.current_version + 1,
        canvas_state: body.canvas_state,
        created_by: user.id,
        change_summary: body.change_summary || 'Canvas updated',
      });
    }

    const { data: workflow, error: updateError } = await supabase
      .from('workflows')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[PATCH /api/workflows/:id] Error:', updateError);
      return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
    }

    return NextResponse.json({ workflow });
  } catch (err) {
    console.error('[PATCH /api/workflows/:id] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/workflows/:id
 * Soft-deletes the workflow (sets deleted_at)
 */
export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;
    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from('workflows')
      .update({ deleted_at: new Date().toISOString(), status: 'archived' })
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/workflows/:id] Error:', error);
      return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/workflows/:id] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
