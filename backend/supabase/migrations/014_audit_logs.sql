-- ============================================================
-- FILE: supabase/migrations/014_audit_logs.sql
-- Audit logs for team collaboration and compliance
-- ============================================================

-- Audit log action types
CREATE TYPE audit_action AS ENUM (
  -- Workspace actions
  'workspace.created',
  'workspace.updated',
  'workspace.deleted',
  
  -- Member actions
  'member.invited',
  'member.joined',
  'member.role_changed',
  'member.removed',
  
  -- Workflow actions
  'workflow.created',
  'workflow.updated',
  'workflow.deleted',
  'workflow.activated',
  'workflow.paused',
  'workflow.run_triggered',
  
  -- Integration actions
  'integration.added',
  'integration.updated',
  'integration.removed',
  
  -- Data actions
  'data.exported',
  'data.deleted',
  
  -- Billing actions
  'billing.plan_changed',
  'billing.payment_succeeded',
  'billing.payment_failed'
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT, -- Denormalized for faster queries
  
  -- What happened
  action audit_action NOT NULL,
  resource_type TEXT NOT NULL, -- 'workflow', 'integration', 'member', etc.
  resource_id UUID, -- ID of the affected resource
  
  -- Context
  metadata JSONB DEFAULT '{}', -- Additional context (e.g., old/new values)
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_audit_logs_workspace ON audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can view audit logs"
  ON audit_logs FOR SELECT
  USING (is_workspace_member(workspace_id, auth.uid()));

-- Auto-prune old audit logs (keep 1 year for compliance)
SELECT cron.schedule(
  'prune-old-audit-logs',
  '0 5 1 * *', -- First of every month at 5 AM UTC
  $$DELETE FROM audit_logs WHERE created_at < now() - INTERVAL '1 year'$$
);

-- Helper function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log(
  workspace_id_input UUID,
  user_id_input UUID,
  action_input audit_action,
  resource_type_input TEXT,
  resource_id_input UUID DEFAULT NULL,
  metadata_input JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email_val TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email_val FROM auth.users WHERE id = user_id_input;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    workspace_id,
    user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    workspace_id_input,
    user_id_input,
    user_email_val,
    action_input,
    resource_type_input,
    resource_id_input,
    metadata_input
  );
END;
$$;
