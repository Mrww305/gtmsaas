// ============================================================
// backend/app/api/workflows/route.ts
// GET: List workflows for workspace
// POST: Create a new workflow
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser } from '@/lib/supabase/server';
import { getUserWorkspace } from '@/lib/supabase/server';

/**
 * GET /api/workflows
 * Returns all workflows for the user's workspace
 * Query params: ?status=draft|active|paused|archived
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = createSupabaseServerClient();

    let query = supabase
      .from('workflows')
      .select(`
        id, name, description, emoji, status, current_version,
        trigger_type, is_dry_run, created_at, updated_at, last_run_at,
        created_by
      `)
      .eq('workspace_id', workspaceData.workspace.id)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: workflows, error } = await query;

    if (error) {
      console.error('[GET /api/workflows] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
    }

    return NextResponse.json({ workflows });
  } catch (err) {
    console.error('[GET /api/workflows] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/workflows
 * Creates a new workflow with initial canvas state
 * Body: { name, description?, emoji?, canvas_state? }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 });
    }

    if (!['owner', 'admin', 'editor'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, emoji, canvas_state } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const defaultCanvas = {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const { data: workflow, error } = await supabase
      .from('workflows')
      .insert({
        workspace_id: workspaceData.workspace.id,
        name: name.trim(),
        description: description?.trim() || null,
        emoji: emoji || '⚡',
        canvas_state: canvas_state || defaultCanvas,
        status: 'draft',
        current_version: 1,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/workflows] Error:', error);
      return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
    }

    // Create initial version snapshot
    await supabase.from('workflow_versions').insert({
      workflow_id: workflow.id,
      version_number: 1,
      canvas_state: workflow.canvas_state,
      created_by: user.id,
      change_summary: 'Initial creation',
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/workflows] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
