-- ============================================================
-- FILE: supabase/migrations/013_rpc_functions.sql
-- RPC functions called from API routes and workers
-- ============================================================

-- ============================================================
-- Increment workflow run counter (called after each run)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_workflow_runs(workspace_id_input UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workspaces
  SET monthly_workflow_runs = monthly_workflow_runs + 1
  WHERE id = workspace_id_input;
END;
$$;

-- ============================================================
-- Increment enrichment counter (called after enrichment nodes)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_enrichment_count(
  workspace_id_input UUID,
  count_input INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE workspaces
  SET monthly_enrichment_count = monthly_enrichment_count + count_input
  WHERE id = workspace_id_input;
END;
$$;

-- ============================================================
-- Check if workspace has capacity for more runs/enrichments
-- Called before triggering a run
-- ============================================================
CREATE OR REPLACE FUNCTION check_workspace_capacity(workspace_id_input UUID)
RETURNS TABLE(
  can_run BOOLEAN,
  runs_remaining INT,
  enrichments_remaining INT,
  reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ws workspaces%ROWTYPE;
BEGIN
  SELECT * INTO ws FROM workspaces WHERE id = workspace_id_input;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, 'Workspace not found'::TEXT;
    RETURN;
  END IF;
  
  DECLARE
    runs_left INT := ws.monthly_workflow_run_limit - ws.monthly_workflow_runs;
    enrich_left INT := ws.monthly_enrichment_limit - ws.monthly_enrichment_count;
  BEGIN
    IF runs_left <= 0 THEN
      RETURN QUERY SELECT false, 0, enrich_left, 'Monthly workflow run limit reached'::TEXT;
    ELSIF enrich_left <= 0 THEN
      RETURN QUERY SELECT false, runs_left, 0, 'Monthly enrichment limit reached'::TEXT;
    ELSE
      RETURN QUERY SELECT true, runs_left, enrich_left, NULL::TEXT;
    END IF;
  END;
END;
$$;

-- ============================================================
-- Get workspace usage summary (for billing dashboard)
-- ============================================================
CREATE OR REPLACE FUNCTION get_workspace_usage(workspace_id_input UUID)
RETURNS TABLE(
  monthly_enrichment_count INT,
  monthly_enrichment_limit INT,
  monthly_workflow_runs INT,
  monthly_workflow_run_limit INT,
  total_runs_all_time BIGINT,
  total_cost_all_time NUMERIC,
  billing_cycle_start TIMESTAMPTZ,
  plan TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.monthly_enrichment_count,
    w.monthly_enrichment_limit,
    w.monthly_workflow_runs,
    w.monthly_workflow_run_limit,
    (SELECT COUNT(*) FROM runs r WHERE r.workspace_id = workspace_id_input),
    (SELECT COALESCE(SUM(r.total_cost_usd), 0) FROM runs r WHERE r.workspace_id = workspace_id_input),
    w.billing_cycle_start,
    w.plan
  FROM workspaces w
  WHERE w.id = workspace_id_input;
END;
$$;

-- ============================================================
-- Get run logs for a specific run (for frontend display)
-- Returns node-level execution details
-- ============================================================
CREATE OR REPLACE FUNCTION get_run_logs_with_details(run_id_input UUID)
RETURNS TABLE(
  node_id TEXT,
  node_type TEXT,
  node_label TEXT,
  status node_status,
  execution_order INT,
  input_data JSONB,
  output_data JSONB,
  error_code TEXT,
  error_message TEXT,
  error_retryable BOOLEAN,
  retry_count INT,
  duration_ms INT,
  cost_usd NUMERIC,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    rl.node_id,
    rl.node_type,
    rl.node_label,
    rl.status,
    rl.execution_order,
    rl.input_data,
    rl.output_data,
    rl.error_code,
    rl.error_message,
    rl.error_retryable,
    rl.retry_count,
    rl.duration_ms,
    rl.cost_usd,
    rl.started_at,
    rl.completed_at
  FROM run_logs rl
  WHERE rl.run_id = run_id_input
  ORDER BY rl.execution_order ASC;
$$;

-- ============================================================
-- Soft-delete all data for a workspace (GDPR compliance)
-- Called when user requests account deletion
-- ============================================================
CREATE OR REPLACE FUNCTION delete_workspace_data(workspace_id_input UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete in dependency order
  DELETE FROM run_logs WHERE workspace_id = workspace_id_input;
  DELETE FROM runs WHERE workspace_id = workspace_id_input;
  DELETE FROM workflow_versions WHERE workflow_id IN (SELECT id FROM workflows WHERE workspace_id = workspace_id_input);
  DELETE FROM workflows WHERE workspace_id = workspace_id_input;
  DELETE FROM data_records WHERE workspace_id = workspace_id_input;
  DELETE FROM integrations WHERE workspace_id = workspace_id_input;
  DELETE FROM workspace_members WHERE workspace_id = workspace_id_input;
  DELETE FROM workspaces WHERE id = workspace_id_input;
END;
$$;

-- ============================================================
-- Create initial workspace for a new user (called after signup)
-- ============================================================
CREATE OR REPLACE FUNCTION create_default_workspace(
  user_id_input UUID,
  workspace_name_input TEXT,
  workspace_slug_input TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Create workspace
  INSERT INTO workspaces (name, slug, plan)
  VALUES (workspace_name_input, workspace_slug_input, 'starter')
  RETURNING id INTO new_workspace_id;
  
  -- Add user as owner
  INSERT INTO workspace_members (workspace_id, user_id, role, joined_at)
  VALUES (new_workspace_id, user_id_input, 'owner', now());
  
  RETURN new_workspace_id;
END;
$$;
