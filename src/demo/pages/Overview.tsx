import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Building2, CircleDollarSign, Target, Ticket, TrendingUp, Wallet } from "lucide-react";
import { useDemo } from "../store";
import { useAuth } from "../auth";
import { PERSONAS, PersonaId } from "../nav";
import { Badge, Card, CardHeader, Progress, Stat, statusTone, cn } from "../ui";
import { money } from "../api";

const COLORS = ["#4f46e5", "#0ea5e9", "#10b981", "#f59e0b"];

export default function Overview() {
  const { data } = useDemo();
  const { user } = useAuth();
  if (!data) return null;
  const { metrics, opportunities, orders, tickets, accounts, technicians } = data;
  const persona = (localStorage.getItem("demo_persona") as PersonaId) || "executive";

  const pipelineTop = useMemo(() => [...opportunities].sort((a, b) => Number(b.deal_value_pkr) - Number(a.deal_value_pkr)).slice(0, 4), [opportunities]);
  const openTickets = tickets.filter((t) => t.status !== "Resolved").slice(0, 5);
  const recentOrders = orders.slice(0, 5);
  const creditPct = Math.round((Number(metrics.creditExposure) / Math.max(1, Number(metrics.creditLimit))) * 100);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{PERSONAS[persona].sub}</div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Good to see you, {user?.name?.split(" ")[0] || "there"}</h1>
          <p className="mt-1 text-sm text-slate-500">Here is the live state of the JW × Enviro revenue and service operation.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live demo data</Badge>
          <Badge tone="slate">{new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open pipeline" value={money(metrics.pipeline, true)} sub={`${opportunities.filter((o) => o.stage !== "Closed-Won").length} active opportunities`} icon={<Target className="h-5 w-5" />} />
        <Stat label="Closed won" value={money(metrics.won, true)} sub="FY 2026 to date" icon={<TrendingUp className="h-5 w-5" />} tone="emerald" />
        <Stat label="Credit exposure" value={money(metrics.creditExposure, true)} sub={`${creditPct}% of ${money(metrics.creditLimit, true)} limit`} icon={<Wallet className="h-5 w-5" />} tone="amber" />
        <Stat label="Open SLA tickets" value={metrics.openTickets} sub={`${metrics.resolvedTickets} resolved · ${metrics.totalTickets} total`} icon={<Ticket className="h-5 w-5" />} tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Pipeline by entity" subtitle="Deal value across verticals" icon={<Building2 className="h-4 w-4" />} />
          <div className="h-64 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.revenueByVertical} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `${Math.round(Number(v) / 1000000)}M`} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={44} />
                <Tooltip formatter={(v: any) => money(v, true)} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {metrics.revenueByVertical.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Service ticket mix" subtitle="Warranty and field dispatch" icon={<Ticket className="h-4 w-4" />} />
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="h-48 w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={metrics.ticketStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={3}>
                    {metrics.ticketStatus.map((_, i) => <Cell key={i} fill={["#f59e0b", "#0ea5e9", "#10b981"][i % 3]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {metrics.ticketStatus.map((s, i) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="h-2 w-2 rounded-full" style={{ background: ["#f59e0b", "#0ea5e9", "#10b981"][i % 3] }} /> {s.name}
                    </span>
                    <span className="font-semibold text-slate-900">{s.value}</span>
                  </div>
                  <div className="mt-1"><Progress value={(s.value / Math.max(1, metrics.totalTickets)) * 100} tone={i === 0 ? "amber" : i === 1 ? "indigo" : "emerald"} /></div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Top B2B opportunities"
            subtitle="Cross-entity institutional pipeline"
            icon={<Target className="h-4 w-4" />}
            action={<Link to="/demo/app/opportunities" className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          />
          <div className="divide-y divide-slate-100">
            {pipelineTop.map((o) => (
              <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600">#{o.id}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-slate-900">{o.title}</div>
                  <div className="text-[11px] text-slate-500">{o.account_name} · {o.vertical_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">{money(o.deal_value_pkr, true)}</div>
                  <Badge tone={statusTone(o.stage)} className="mt-1">{o.stage}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={persona === "dispatcher" ? "Open service tickets" : "Latest channel orders"}
            subtitle={persona === "dispatcher" ? "SLA clocks running" : "Primary and secondary sales"}
            icon={<CircleDollarSign className="h-4 w-4" />}
            action={<Link to={persona === "dispatcher" ? "/demo/app/tickets" : "/demo/app/orders"} className="text-xs font-semibold text-indigo-600 hover:underline">View all</Link>}
          />
          <div className="divide-y divide-slate-100">
            {(persona === "dispatcher" ? openTickets : recentOrders).map((row: any) => (
              <div key={row.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-slate-900">
                    {persona === "dispatcher" ? `${row.ticket_number} · ${row.contact_name}` : `${row.order_number} · ${row.account_name}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {persona === "dispatcher" ? `${row.issue_type} · ${row.channel}` : `${row.order_type} · ${row.payment_status}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-900">
                    {persona === "dispatcher" ? row.status : money(row.total_amount_pkr, true)}
                  </div>
                  <Badge tone={statusTone(persona === "dispatcher" ? row.status : row.order_status)} className="mt-1">
                    {persona === "dispatcher" ? row.issue_type : row.order_status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Order value trend" subtitle="Last 8 channel orders (PKR '00K)" icon={<TrendingUp className="h-4 w-4" />} />
          <div className="h-48 px-3 py-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.orderTrend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="orderFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#orderFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Credit watchlist" subtitle="Dealers above 80% utilisation" icon={<AlertTriangle className="h-4 w-4" />} />
          <div className="divide-y divide-slate-100">
            {accounts
              .filter((a) => Number(a.current_balance_pkr) / Math.max(1, Number(a.credit_limit_pkr)) >= 0.8)
              .slice(0, 4)
              .map((a) => {
                const pct = Math.round((Number(a.current_balance_pkr) / Number(a.credit_limit_pkr)) * 100);
                return (
                  <div key={a.id} className="px-5 py-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-semibold text-slate-900">{a.name}</span>
                      <span className={cn("font-bold", pct >= 95 ? "text-rose-600" : "text-amber-600")}>{pct}%</span>
                    </div>
                    <div className="mt-1.5"><Progress value={pct} tone={pct >= 95 ? "rose" : "amber"} /></div>
                    <div className="mt-1 text-[11px] text-slate-500">{money(a.current_balance_pkr, true)} of {money(a.credit_limit_pkr, true)}</div>
                  </div>
                );
              })}
            {accounts.filter((a) => Number(a.current_balance_pkr) / Math.max(1, Number(a.credit_limit_pkr)) >= 0.8).length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-slate-500">All dealers within credit limits.</div>
            ) : null}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Technician coverage" subtitle="Live field availability by city" icon={<Building2 className="h-4 w-4" />} />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {technicians.map((t) => (
            <div key={t.id} className="rounded-xl border border-slate-200 px-3.5 py-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-900">{t.name}</div>
                <Badge tone={statusTone(t.status)}>{t.status === "on_job" ? "On job" : "Available"}</Badge>
              </div>
              <div className="mt-1 text-[11px] text-slate-500">{t.city} · {t.phone}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
