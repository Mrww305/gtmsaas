// ============================================================
// COMPONENT: Workflow Analytics
// Purpose: Display workflow performance, ROI, and cost attribution
// Usage: <WorkflowAnalytics workflowId="xxx" />
// ============================================================

'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
  period: string;
  workflow_id: string | null;
  metrics: {
    total_runs: number;
    completed_runs: number;
    failed_runs: number;
    success_rate: number;
    total_cost: number;
    enrichment_cost: number;
    ai_cost: number;
    avg_cost_per_run: number;
    avg_duration_ms: number;
    total_nodes_executed: number;
    successful_nodes: number;
    failed_nodes: number;
  };
  roi: {
    estimated_replies: number;
    estimated_deals: number;
    estimated_revenue: number;
    total_cost: number;
    roi_percentage: number;
    cost_per_reply: number;
    cost_per_deal: number;
  };
  node_performance: Array<{
    key: string;
    node_type: string;
    total_executions: number;
    successful: number;
    failed: number;
    avg_duration_ms: number;
    total_cost: number;
    success_rate: number;
  }>;
  cost_by_node_type: Array<{
    node_type: string;
    cost: number;
    percentage: number;
  }>;
}

interface WorkflowAnalyticsProps {
  workflowId?: string;
}

export function WorkflowAnalytics({ workflowId }: WorkflowAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [workflowId, period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (workflowId) params.set('workflow_id', workflowId);

      const response = await fetch(`/api/analytics?${params}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return <div className="animate-pulse h-96 bg-slate-800 rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {workflowId ? 'Workflow Analytics' : 'Platform Analytics'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Performance metrics and ROI tracking
          </p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                period === p
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* ROI Card */}
      <div className="bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Estimated ROI</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-3xl font-bold text-emerald-400">
              {data.roi.roi_percentage.toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400 mt-1">ROI</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">
              ${data.roi.estimated_revenue.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Est. Revenue</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-cyan-400">
              {data.roi.estimated_replies}
            </div>
            <div className="text-xs text-slate-400 mt-1">Est. Replies</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-violet-400">
              {data.roi.estimated_deals}
            </div>
            <div className="text-xs text-slate-400 mt-1">Est. Deals</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-sm">
          <span className="text-slate-400">Cost per reply:</span>
          <span className="text-white font-medium">${data.roi.cost_per_reply.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Cost per deal:</span>
          <span className="text-white font-medium">${data.roi.cost_per_deal.toFixed(2)}</span>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Runs"
          value={data.metrics.total_runs.toLocaleString()}
          icon="📊"
        />
        <MetricCard
          label="Success Rate"
          value={`${data.metrics.success_rate.toFixed(1)}%`}
          icon="✅"
        />
        <MetricCard
          label="Avg Duration"
          value={`${(data.metrics.avg_duration_ms / 1000).toFixed(1)}s`}
          icon="⏱️"
        />
        <MetricCard
          label="Total Cost"
          value={`$${data.metrics.total_cost.toFixed(2)}`}
          icon="💰"
        />
      </div>

      {/* Cost Breakdown */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Cost Breakdown</h3>
        <div className="space-y-3">
          <CostBar
            label="Enrichment"
            cost={data.metrics.enrichment_cost}
            total={data.metrics.total_cost}
            color="bg-cyan-500"
          />
          <CostBar
            label="AI Processing"
            cost={data.metrics.ai_cost}
            total={data.metrics.total_cost}
            color="bg-violet-500"
          />
          <CostBar
            label="Other"
            cost={data.metrics.total_cost - data.metrics.enrichment_cost - data.metrics.ai_cost}
            total={data.metrics.total_cost}
            color="bg-slate-500"
          />
        </div>
      </div>

      {/* Node Performance */}
      {data.node_performance.length > 0 && (
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Node Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-white/5">
                  <th className="pb-3 font-medium">Node</th>
                  <th className="pb-3 font-medium">Executions</th>
                  <th className="pb-3 font-medium">Success Rate</th>
                  <th className="pb-3 font-medium">Avg Duration</th>
                  <th className="pb-3 font-medium text-right">Cost</th>
                </tr>
              </thead>
              <tbody>
                {data.node_performance.slice(0, 10).map((node) => (
                  <tr key={node.key} className="border-b border-white/5 last:border-0">
                    <td className="py-3">
                      <div className="text-sm text-white font-medium">{node.node_type}</div>
                      <div className="text-xs text-slate-500">{node.key.split('-')[1]}</div>
                    </td>
                    <td className="py-3 text-sm text-slate-300">{node.total_executions}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              node.success_rate > 90 ? 'bg-emerald-500' :
                              node.success_rate > 70 ? 'bg-amber-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${node.success_rate}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{node.success_rate.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-300">{(node.avg_duration_ms / 1000).toFixed(2)}s</td>
                    <td className="py-3 text-sm text-white text-right font-medium">
                      ${node.total_cost.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function CostBar({ label, cost, total, color }: { label: string; cost: number; total: number; color: string }) {
  const percentage = total > 0 ? (cost / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm text-white font-medium">${cost.toFixed(2)}</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="text-xs text-slate-500 mt-1">{percentage.toFixed(1)}% of total</div>
    </div>
  );
}
