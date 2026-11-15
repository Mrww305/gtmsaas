import React from "react";
import { Activity, CheckCircle2, Clock, Mail, ShieldCheck, User } from "lucide-react";
import { useDemo } from "../store";
import { dateShort, timeShort } from "../api";
import { Badge, Card, CardHeader, Progress, cn } from "../ui";

const LIMITS: Record<string, { label: string; limit: number }> = {
  ticket_create: { label: "WhatsApp tickets", limit: 5 },
  order_create: { label: "Dealer orders", limit: 5 },
  cross_sell: { label: "Cross-sell suggestions", limit: 10 },
  erp_sync: { label: "ERP syncs", limit: 10 },
};

export default function ActivityPage() {
  const { data } = useDemo();
  if (!data) return null;

  const usageMap = new Map(data.usage.map((u) => [u.action, Number(u.count)]));

  return (
    <div className="space-y-5">
      <div>
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Platform</div>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950"><Activity className="h-6 w-6 text-slate-400" /> Activity & demo limits</h1>
        <p className="mt-1 text-sm text-slate-500">Every action is logged. Daily quotas keep the sandbox safe for everyone.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Audit trail" subtitle="Your actions in this demo workspace" icon={<Activity className="h-4 w-4" />} />
          {data.activity.length === 0 ? (
            <div className="px-5 py-12 text-center text-xs text-slate-500">No activity yet. Run a flow to see it here.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[11px] font-semibold text-slate-900">{a.action}</div>
                    <div className="text-[11px] text-slate-500">{a.detail || "—"}</div>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-400">{timeShort(a.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Daily action quota" subtitle="Resets at midnight" icon={<Clock className="h-4 w-4" />} />
            <div className="space-y-3.5 p-5">
              {Object.entries(LIMITS).map(([key, cfg]) => {
                const used = usageMap.get(key) || 0;
                const pct = Math.round((used / cfg.limit) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-600">{cfg.label}</span>
                      <span className={cn("font-semibold", used >= cfg.limit ? "text-rose-600" : "text-slate-900")}>{used} / {cfg.limit}</span>
                    </div>
                    <div className="mt-1.5"><Progress value={pct} tone={used >= cfg.limit ? "rose" : pct >= 70 ? "amber" : "emerald"} /></div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Workspace" subtitle="Demo account details" icon={<User className="h-4 w-4" />} />
            <div className="space-y-2 p-5 text-xs">
              {[
                ["Name", data.user.name],
                ["Email", data.user.email],
                ["Company", data.user.company || "—"],
                ["Role", data.user.role || "—"],
                ["Use case", data.user.useCase || "—"],
                ["Team size", data.user.teamSize || "—"],
                ["Demo window", `${data.meta.demoDays} days`],
                ["Joined", dateShort(data.user.createdAt)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="max-w-[60%] truncate font-semibold text-slate-900">{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Prerequisites" subtitle="Access and safety gates" icon={<ShieldCheck className="h-4 w-4" />} />
            <div className="space-y-2.5 p-5 text-xs">
              {[
                ["Email verified", true],
                ["Demo terms accepted", data.user.termsAccepted],
                ["Onboarding completed", data.user.onboarded],
                ["SMTP notifications", data.meta.mail.configured],
              ].map(([label, ok]) => (
                <div key={label as string} className="flex items-center justify-between">
                  <span className="text-slate-600">{label}</span>
                  <Badge tone={ok ? "emerald" : "amber"}>{ok ? "Enabled" : "Pending"}</Badge>
                </div>
              ))}
              <div className="mt-2 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Lead forms email {data.meta.mail.notify}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
