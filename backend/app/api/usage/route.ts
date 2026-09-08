// ============================================================
// API ROUTE: Usage Dashboard
// Purpose: Get detailed usage metrics for the dashboard
// Endpoint: GET /api/usage
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getAuthenticatedUser, getUserWorkspace } from '@/lib/supabase/server';

/**
 * GET /api/usage
 * Get detailed usage metrics
 * Query params: ?period=7d|30d|90d
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const workspaceData = await getUserWorkspace(user.id);
    if (!workspaceData) return NextResponse.json({ error: 'No workspace found' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';

    const supabase = createSupabaseServerClient();
    const workspace = workspaceData.workspace;

    // Calculate date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get current month usage
    const currentUsage = {
      enrichments: {
        used: workspace.monthly_enrichment_count,
        limit: workspace.monthly_enrichment_limit,
        percentage: workspace.monthly_enrichment_limit > 0
          ? (workspace.monthly_enrichment_count / workspace.monthly_enrichment_limit) * 100
          : 0,
      },
      workflow_runs: {
        used: workspace.monthly_workflow_runs,
        limit: workspace.monthly_workflow_run_limit,
        percentage: workspace.monthly_workflow_run_limit > 0
          ? (workspace.monthly_workflow_runs / workspace.monthly_workflow_run_limit) * 100
          : 0,
      },
    };

    // Get runs in date range
    const {  runs } = await supabase
      .from('runs')
      .select('id, status, total_cost_usd, enrichment_cost_usd, ai_cost_usd, created_at, workflow_id')
      .eq('workspace_id', workspace.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    // Get daily usage breakdown
    const dailyUsage = new Map<string, {
      date: string;
      runs: number;
      cost: number;
      enrichments: number;
      ai_calls: number;
    }>();

    (runs || []).forEach((run) => {
      const date = new Date(run.created_at).toISOString().split('T')[0];
      
      if (!dailyUsage.has(date)) {
        dailyUsage.set(date, {
          date,
          runs: 0,
          cost: 0,
          enrichments: 0,
          ai_calls: 0,
        });
      }

      const dayData = dailyUsage.get(date)!;
      dayData.runs++;
      dayData.cost += parseFloat(run.total_cost_usd as any) || 0;
      
      // Estimate enrichments and AI calls from cost
      if (run.enrichment_cost_usd) {
        dayData.enrichments += Math.round((parseFloat(run.enrichment_cost_usd as any) || 0) / 0.01);
      }
      if (run.ai_cost_usd) {
        dayData.ai_calls += Math.round((parseFloat(run.ai_cost_usd as any) || 0) / 0.001);
      }
    });

    // Get workflow performance
    const {  workflows } = await supabase
      .from('workflows')
      .select('id, name, last_run_at, status')
      .eq('workspace_id', workspace.id)
      .is('deleted_at', null);

    // Get cost breakdown by workflow
    const workflowCosts = new Map<string, {
      workflow_id: string;
      total_cost: number;
      run_count: number;
    }>();

    (runs || []).forEach((run) => {
      if (!workflowCosts.has(run.workflow_id)) {
        workflowCosts.set(run.workflow_id, {
          workflow_id: run.workflow_id,
          total_cost: 0,
          run_count: 0,
        });
      }

      const wfCost = workflowCosts.get(run.workflow_id)!;
      wfCost.total_cost += parseFloat(run.total_cost_usd as any) || 0;
      wfCost.run_count++;
    });

    // Calculate totals
    const totalCost = (runs || []).reduce((sum, run) => {
      return sum + (parseFloat(run.total_cost_usd as any) || 0);
    }, 0);

    const totalRuns = (runs || []).length;
    const successfulRuns = (runs || []).filter(r => r.status === 'completed').length;
    const failedRuns = (runs || []).filter(r => r.status === 'failed').length;

    return NextResponse.json({
      period,
      current_usage: currentUsage,
      totals: {
        runs: totalRuns,
        successful_runs: successfulRuns,
        failed_runs: failedRuns,
        success_rate: totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0,
        total_cost: totalCost,
        avg_cost_per_run: totalRuns > 0 ? totalCost / totalRuns : 0,
      },
      daily_usage: Array.from(dailyUsage.values()).sort((a, b) => a.date.localeCompare(b.date)),
      workflow_costs: Array.from(workflowCosts.values()).sort((a, b) => b.total_cost - a.total_cost),
      billing_cycle: {
        start: workspace.billing_cycle_start,
        plan: workspace.plan,
      },
    });
  } catch (err) {
    console.error('[GET /api/usage] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
