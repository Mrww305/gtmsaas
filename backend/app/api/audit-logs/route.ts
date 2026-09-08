// ============================================================
// API ROUTE: Audit Logs
// Purpose: Query audit logs for compliance and debugging
// Endpoint: GET /api/audit-logs
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser, getUserWorkspace } from '@/lib/supabase/server';

/**
 * GET /api/audit-logs
 * Query audit logs with filters
 * Query params: ?action=workflow.created&resource_type=workflow&page=1&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    // Only admins and owners can view audit logs
    if (!['owner', 'admin'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const resourceType = searchParams.get('resource_type');
    const userId = searchParams.get('user_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const supabase = createSupabaseServerClient();

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('workspace_id', workspaceData.workspace.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (action) {
      query = query.eq('action', action);
    }

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const {  logs, error, count } = await query;

    if (error) {
      console.error('[GET /api/audit-logs] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (err) {
    console.error('[GET /api/audit-logs] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
