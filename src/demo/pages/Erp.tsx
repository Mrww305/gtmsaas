import React, { useState } from "react";
import { CheckCircle2, Database, Plug, RefreshCw, Server, ShieldCheck, Terminal } from "lucide-react";
import { useDemo } from "../store";
import { api, timeShort } from "../api";
import { Badge, Button, Card, CardHeader, Select, statusTone, cn } from "../ui";

const PROVIDERS = [
  { id: "SAP S/4HANA", label: "SAP S/4HANA", sub: "Enterprise suite", endpoint: "/sap/opu/odata/sap/API_SALES_ORDER_SRV" },
  { id: "Oracle NetSuite", label: "Oracle NetSuite", sub: "Mid-market cloud ERP", endpoint: "/services/rest/record/v1/salesOrder" },
  { id: "MS Dynamics 365", label: "MS Dynamics 365", sub: "Microsoft business apps", endpoint: "/api/data/v9.2/salesorders" },
];

export default function Erp() {
  const { data, refresh, toast } = useDemo();
  const [provider, setProvider] = useState(data?.erp?.provider || "SAP S/4HANA");
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<any>(() => {
    try { return data?.erp?.payload ? JSON.parse(data.erp.payload) : null; } catch { return null; }
  });

  if (!data) return null;

  const active = PROVIDERS.find((p) => p.id === provider)!;

  async function sync() {
    setLoading(true);
    try {
      const res = await api("/demo/erp/sync", { method: "POST", body: JSON.stringify({ provider }) });
      setPayload(res);
      await refresh();
      toast(`${provider} sync completed — 5 records`, "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  const events = payload?.events || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Platform</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950"><Plug className="h-6 w-6 text-slate-400" /> ERP sync simulator</h1>
          <p className="mt-1 text-sm text-slate-500">Prove integration readiness with live invoice, inventory and GL payloads.</p>
        </div>
        <Badge tone="emerald"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Connected: {data.erp?.provider || "—"}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader title="Connector" subtitle="Switch the mock ERP backend" icon={<Server className="h-4 w-4" />} />
            <div className="space-y-2 p-5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProvider(p.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition",
                    provider === p.id ? "border-indigo-300 bg-indigo-50/70" : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", provider === p.id ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500")}>
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900">{p.label}</div>
                    <div className="text-[11px] text-slate-500">{p.sub}</div>
                  </div>
                  {provider === p.id ? <CheckCircle2 className="h-4 w-4 text-indigo-600" /> : null}
                </button>
              ))}
              <Button className="mt-2 w-full" onClick={sync} loading={loading}><RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Run sync</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Connection health" subtitle="Mock webhook and API status" icon={<ShieldCheck className="h-4 w-4" />} />
            <div className="space-y-2.5 p-5 text-xs">
              {[
                ["API endpoint", active.endpoint, "emerald"],
                ["Auth", "OAuth 2.0 client credentials", "emerald"],
                ["Last sync", data.erp?.last_sync ? timeShort(data.erp.last_sync) : "Not synced", "slate"],
                ["Direction", "Bi-directional (orders + inventory)", "indigo"],
              ].map(([k, v, tone]) => (
                <div key={k as string} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-slate-500">{k}</span>
                  <Badge tone={tone as any}>{v}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Payload log"
            subtitle={payload ? `${events.length} events · ${payload.durationMs ?? payload.summary?.durationMs ?? 842}ms` : "Run a sync to stream events"}
            icon={<Terminal className="h-4 w-4" />}
            action={<Badge tone={statusTone(payload ? "success" : "idle")}>{payload ? "success" : "idle"}</Badge>}
          />
          <div className="bg-slate-950 p-4">
            <pre className="max-h-[300px] overflow-auto rounded-lg bg-slate-900 p-3 text-[11px] leading-relaxed text-emerald-300">
{payload ? JSON.stringify({ provider: payload.provider, endpoint: payload.endpoint, summary: payload.summary, events: payload.events }, null, 2) : JSON.stringify({ status: "idle", hint: "Select an ERP and press Run sync" }, null, 2)}
            </pre>
          </div>
          <div className="divide-y divide-slate-100">
            {events.map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-3 px-5 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-900"><span className="font-mono text-[10px] text-slate-400">{e.type}</span> {e.ref}</div>
                  <div className="text-[11px] text-slate-500">{e.detail}</div>
                </div>
                <span className="shrink-0 font-mono text-[10px] text-slate-400">{new Date(e.ts).toLocaleTimeString("en-GB")}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="What this proves" subtitle="Integration readiness for technical buyers" icon={<Plug className="h-4 w-4" />} />
        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Invoice sync", "AR ledger postings with currency and tax codes"],
            ["Inventory reservation", "Warehouse-level stock holds on order commit"],
            ["Customer master", "Credit profile and account upsert"],
            ["GL posting", "Balanced revenue and COGS journals"],
          ].map(([t, b]) => (
            <div key={t} className="rounded-xl border border-slate-200 p-3.5">
              <div className="text-xs font-semibold text-slate-900">{t}</div>
              <div className="mt-1 text-[11px] text-slate-500">{b}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
