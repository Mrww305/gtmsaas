import React, { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles, Target, TrendingUp, Wand2 } from "lucide-react";
import { useDemo } from "../store";
import { api, dateShort, money } from "../api";
import { Badge, Button, Card, CardHeader, Empty, Modal, Progress, Spinner, statusTone } from "../ui";

const STAGES = ["Lead", "Proposal", "Negotiation", "Closed-Won"];

export default function Opportunities() {
  const { data, refresh, toast } = useDemo();
  const [openId, setOpenId] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("all");

  if (!data) return null;

  const opps = useMemo(() => (stage === "all" ? data.opportunities : data.opportunities.filter((o) => o.stage === stage)), [data.opportunities, stage]);

  const byStage = STAGES.map((s) => ({
    stage: s,
    count: data.opportunities.filter((o) => o.stage === s).length,
    value: data.opportunities.filter((o) => o.stage === s).reduce((sum, o) => sum + Number(o.deal_value_pkr), 0),
  }));

  async function suggest(opp: any) {
    setOpenId(opp.id);
    setSuggestion(null);
    setLoading(true);
    try {
      const res = await api(`/demo/opportunities/${opp.id}/cross-sell`, { method: "POST" });
      setSuggestion(res);
      await refresh();
      toast(`Cross-sell bundle generated for ${opp.account_name}`, "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Revenue</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950"><Target className="h-6 w-6 text-slate-400" /> B2B opportunities</h1>
          <p className="mt-1 text-sm text-slate-500">Institutional pipeline with rule-based cross-vertical bundling.</p>
        </div>
        <Badge tone="indigo">{money(data.metrics.pipeline, true)} open pipeline</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {byStage.map((s) => (
          <button
            key={s.stage}
            onClick={() => setStage(stage === s.stage ? "all" : s.stage)}
            className={`rounded-2xl border p-4 text-left transition ${stage === s.stage ? "border-indigo-300 bg-indigo-50/60" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">{s.stage}</span>
              <Badge tone={statusTone(s.stage)}>{s.count}</Badge>
            </div>
            <div className="mt-2 text-lg font-bold text-slate-900">{money(s.value, true)}</div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          title="Opportunity pipeline"
          subtitle={stage === "all" ? "All stages" : `Filtered: ${stage}`}
          icon={<TrendingUp className="h-4 w-4" />}
          action={stage !== "all" ? <button onClick={() => setStage("all")} className="text-xs font-semibold text-indigo-600 hover:underline">Clear filter</button> : null}
        />
        {opps.length === 0 ? (
          <Empty title="No opportunities in this stage" />
        ) : (
          <div className="divide-y divide-slate-100">
            {opps.map((o) => (
              <div key={o.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{o.title}</span>
                    {o.cross_sell_flag ? <Badge tone="violet"><Sparkles className="h-3 w-3" /> bundle ready</Badge> : null}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{o.account_name} · {o.vertical_name} · {o.city} · close {dateShort(o.expected_close_date)}</div>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">{money(o.deal_value_pkr, true)}</div>
                    <Badge tone={statusTone(o.stage)} className="mt-1">{o.stage}</Badge>
                  </div>
                  <Button size="sm" variant="secondary" onClick={() => suggest(o)}>
                    <Wand2 className="h-3.5 w-3.5" /> Suggest bundle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={openId !== null} onClose={() => { setOpenId(null); setSuggestion(null); }} title="Cross-vertical bundle" subtitle="Rule-based recommendation across JW-SEZ, JW Forland and Enviro" width="max-w-3xl">
        {loading ? (
          <Spinner label="Matching products and account context" />
        ) : suggestion ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700"><Sparkles className="h-3.5 w-3.5" /> AI-style rationale</div>
              <p className="mt-1.5 text-sm text-indigo-900">{suggestion.rationale}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-700">Confidence {Math.round(suggestion.confidence * 100)}%</div>
              <div className="mt-1"><Progress value={suggestion.confidence * 100} /></div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Product</th>
                    <th className="px-3 py-2 font-semibold">Qty</th>
                    <th className="px-3 py-2 font-semibold">Reason</th>
                    <th className="px-4 py-2 text-right font-semibold">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {suggestion.bundle.map((b: any) => (
                    <tr key={b.productId}>
                      <td className="px-4 py-2.5"><div className="font-semibold text-slate-900">{b.name}</div><div className="font-mono text-[10px] text-slate-400">{b.sku}</div></td>
                      <td className="px-3 py-2.5 text-slate-700">{b.qty}</td>
                      <td className="px-3 py-2.5 text-slate-500">{b.reason}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{money(b.lineTotal, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original deal</div><div className="mt-1 text-sm font-bold text-slate-900">{money(suggestion.opportunity.deal_value_pkr, true)}</div></div>
              <div className="rounded-xl border border-slate-200 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bundle value</div><div className="mt-1 text-sm font-bold text-slate-900">{money(suggestion.bundleValue, true)}</div></div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3"><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Combined quote</div><div className="mt-1 text-sm font-bold text-emerald-900">{money(suggestion.combinedValue, true)}</div></div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Cross-sell flag saved to the opportunity</div>
              <Button size="sm" onClick={() => { setOpenId(null); setSuggestion(null); }}>Add to quote <ArrowRight className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ) : (
          <Empty title="No suggestion" hint="Try again." />
        )}
      </Modal>
    </div>
  );
}
