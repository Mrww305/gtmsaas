// ============================================================
// COMPONENT: Usage Dashboard
// Purpose: Display usage metrics, costs, and limits
// Usage: <UsageDashboard workspaceId="xxx" />
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface UsageData {
  period: string;
  current_usage: {
    enrichments: { used: number; limit: number; percentage: number };
    workflow_runs: { used: number; limit: number; percentage: number };
  };
  totals: {
    runs: number;
    successful_runs: number;
    failed_runs: number;
    success_rate: number;
    total_cost: number;
    avg_cost_per_run: number;
  };
  daily_usage: Array<{
    date: string;
    runs: number;
    cost: number;
    enrichments: number;
    ai_calls: number;
  }>;
  workflow_costs: Array<{
    workflow_id: string;
    total_cost: number;
    run_count: number;
  }>;
  billing_cycle: {
    start: string;
    plan: string;
  };
}

interface UsageDashboardProps {
  workspaceId: string;
}

export function UsageDashboard({ workspaceId }: UsageDashboardProps) {
  const [data, setData] = useState<UsageData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [workspaceId, period]);

  async function fetchUsage() {
    setLoading(true);
    try {
      const response = await fetch(`/api/usage?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return <div className="animate-pulse h-96 bg-slate-800 rounded-xl" />;
  }

  const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Usage Dashboard</h2>
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

      {/* Current Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UsageCard
          title="Enrichments"
          used={data.current_usage.enrichments.used}
          limit={data.current_usage.enrichments.limit}
          percentage={data.current_usage.enrichments.percentage}
          icon="🔍"
        />
        <UsageCard
          title="Workflow Runs"
          used={data.current_usage.workflow_runs.used}
          limit={data.current_usage.workflow_runs.limit}
          percentage={data.current_usage.workflow_runs.percentage}
          icon="⚡"
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Runs"
          value={data.totals.runs.toLocaleString()}
          icon="📊"
        />
        <StatCard
          label="Success Rate"
          value={`${data.totals.success_rate.toFixed(1)}%`}
          icon="✅"
        />
        <StatCard
          label="Total Cost"
          value={`$${data.totals.total_cost.toFixed(2)}`}
          icon="💰"
        />
        <StatCard
          label="Avg Cost/Run"
          value={`$${data.totals.avg_cost_per_run.toFixed(3)}`}
          icon="📈"
        />
      </div>

      {/* Daily Usage Chart */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Daily Usage</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.daily_usage}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="runs" fill="#8b5cf6" name="Runs" />
            <Bar dataKey="cost" fill="#06b6d4" name="Cost ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Workflow Costs */}
      {data.workflow_costs.length > 0 && (
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Cost by Workflow</h3>
          <div className="space-y-3">
            {data.workflow_costs.slice(0, 5).map((wf, i) => (
              <div key={wf.workflow_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-300">Workflow {wf.workflow_id.slice(0, 8)}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-white">
                    ${wf.total_cost.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">{wf.run_count} runs</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Billing Info */}
      <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Billing Cycle</h3>
            <p className="text-sm text-slate-400 mt-1">
              Current plan: <span className="text-violet-400 font-medium">{data.billing_cycle.plan}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Cycle started: {new Date(data.billing_cycle.start).toLocaleDateString()}
            </p>
          </div>
          <button className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition">
            Manage Billing
          </button>
        </div>
      </div>
    </div>
  );
}

function UsageCard({
  title,
  used,
  limit,
  percentage,
  icon,
}: {
  title: string;
  used: number;
  limit: number;
  percentage: number;
  icon: string;
}) {
  const isWarning = percentage > 80;
  const isCritical = percentage > 95;

  return (
    <div className="bg-slate-800/50 border border-white/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          isCritical ? 'bg-red-500/10 text-red-400' :
          isWarning ? 'bg-amber-500/10 text-amber-400' :
          'bg-emerald-500/10 text-emerald-400'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="text-3xl font-bold text-white mb-2">
        {used.toLocaleString()} <span className="text-lg text-slate-500">/ {limit.toLocaleString()}</span>
      </div>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isCritical ? 'bg-red-500' :
            isWarning ? 'bg-amber-500' :
            'bg-emerald-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
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
