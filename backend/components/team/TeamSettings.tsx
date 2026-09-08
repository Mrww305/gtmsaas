// ============================================================
// COMPONENT: Team Settings
// Purpose: Manage workspace members, invites, and roles
// Usage: <TeamSettings workspaceId="xxx" />
// ============================================================

'use client';

import { useState, useEffect } from 'react';

interface Member {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  invited_email?: string;
  joined_at?: string;
  created_at: string;
}

interface TeamSettingsProps {
  workspaceId: string;
  currentUserId: string;
  currentUserRole: string;
}

export function TeamSettings({ workspaceId, currentUserId, currentUserRole }: TeamSettingsProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [workspaceId]);

  async function fetchTeam() {
    setLoading(true);
    try {
      // Fetch members
      const membersRes = await fetch('/api/team/members');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setMembers(membersData.members || []);
      }

      // Fetch invites
      const invitesRes = await fetch('/api/invites');
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData.invites || []);
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(email: string, role: string) {
    try {
      const response = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });

      if (response.ok) {
        await fetchTeam();
        setShowInviteModal(false);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invite');
      }
    } catch (error) {
      console.error('Failed to send invite:', error);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/team/members?id=${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTeam();
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    try {
      const response = await fetch(`/api/team/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ member_id: memberId, role: newRole }),
      });

      if (response.ok) {
        await fetchTeam();
      }
    } catch (error) {
      console.error('Failed to change role:', error);
    }
  }

  const canManage = currentUserRole === 'owner' || currentUserRole === 'admin';

  if (loading) {
    return <div className="animate-pulse h-96 bg-slate-800 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Team Settings</h2>
          <p className="text-sm text-slate-400 mt-1">Manage workspace members and permissions</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition"
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Pending Invites</h3>
          <div className="space-y-3">
            {invites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-400">📧</span>
                  </div>
                  <div>
                    <div className="text-sm text-white font-medium">{invite.invited_email}</div>
                    <div className="text-xs text-slate-500">Invited as {invite.role}</div>
                  </div>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleRemoveMember(invite.id)}
                    className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Team Members ({members.length})</h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-violet-400 font-bold text-sm">
                    {member.user_id === currentUserId ? 'You' : '👤'}
                  </span>
                </div>
                <div>
                  <div className="text-sm text-white font-medium">
                    {member.user_id === currentUserId ? 'You' : `User ${member.user_id.slice(0, 8)}`}
                  </div>
                  <div className="text-xs text-slate-500">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canManage && member.user_id !== currentUserId ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                    member.role === 'owner' ? 'bg-violet-500/10 text-violet-400' :
                    member.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' :
                    member.role === 'editor' ? 'bg-emerald-500/10 text-emerald-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteModal
          onInvite={handleInvite}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}

function InviteModal({ onInvite, onClose }: { onInvite: (email: string, role: string) => void; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-white mb-4">Invite Team Member</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-white"
            >
              <option value="admin">Admin - Full access</option>
              <option value="editor">Editor - Can edit workflows</option>
              <option value="viewer">Viewer - Read-only access</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => onInvite(email, role)}
              disabled={!email}
              className="flex-1 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Invite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
