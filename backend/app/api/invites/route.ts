// ============================================================
// API ROUTE: Team Invitations
// Purpose: Invite members to workspace, accept/reject invites
// Endpoint: POST /api/invites, GET /api/invites, DELETE /api/invites
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser, getUserWorkspace } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/invites
 * List pending invitations for the workspace
 */
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    const supabase = createSupabaseServerClient();

    // Get pending invites (members who haven't joined yet)
    const {  invites, error } = await supabase
      .from('workspace_members')
      .select('id, invited_email, role, invited_by, created_at')
      .eq('workspace_id', workspaceData.workspace.id)
      .is('joined_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[GET /api/invites] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch invites' }, { status: 500 });
    }

    return NextResponse.json({ invites: invites || [] });
  } catch (err) {
    console.error('[GET /api/invites] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/invites
 * Invite a new member to the workspace
 * Body: { email: string, role: 'admin' | 'editor' | 'viewer' }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    // Only owners and admins can invite
    if (!['owner', 'admin'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const supabaseAdmin = createSupabaseAdminClient();

    // Check if user is already a member
    const {  existingUser } = await supabaseAdmin
      .from('profiles' as any)
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      const {  existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceData.workspace.id)
        .eq('user_id', existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }
    }

    // Check if invite already exists
    const {  existingInvite } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceData.workspace.id)
      .eq('invited_email', email)
      .is('joined_at', null)
      .single();

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent' }, { status: 400 });
    }

    // Create invite
    const {  invite, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceData.workspace.id,
        user_id: existingUser?.id || null,
        invited_email: email,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/invites] Error:', error);
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    // Create audit log
    await supabase.rpc('create_audit_log', {
      workspace_id_input: workspaceData.workspace.id,
      user_id_input: user.id,
      action_input: 'member.invited',
      resource_type_input: 'member',
      resource_id_input: invite.id,
      metadata_input: { email, role },
    });

    // TODO: Send invitation email
    // await sendInviteEmail(email, workspaceData.workspace.name, user.email);

    return NextResponse.json({ invite }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/invites] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/invites
 * Cancel a pending invitation
 * Body: { invite_id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    if (!['owner', 'admin'].includes(workspaceData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const inviteId = searchParams.get('id');

    if (!inviteId) {
      return NextResponse.json({ error: 'Invite ID required' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', inviteId)
      .eq('workspace_id', workspaceData.workspace.id)
      .is('joined_at', null);

    if (error) {
      console.error('[DELETE /api/invites] Error:', error);
      return NextResponse.json({ error: 'Failed to cancel invite' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/invites] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
