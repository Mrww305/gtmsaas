import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, ShoppingCart, Trash2, Wallet } from "lucide-react";
import { useDemo } from "../store";
import { api, dateShort, money } from "../api";
import { Alert, Badge, Button, Card, CardHeader, Empty, Field, Input, Progress, Select, statusTone } from "../ui";

type Line = { productId: number; qty: number };

export default function Orders() {
  const { data, refresh, toast } = useDemo();
  const [dealerId, setDealerId] = useState<number | "">("");
  const [lines, setLines] = useState<Line[]>([{ productId: 1, qty: 10 }]);
  const [payment, setPayment] = useState("Credit");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [creditError, setCreditError] = useState<any>(null);

  if (!data) return null;

  const dealers = data.accounts.filter((a) => ["Retail Dealer", "Regional Distributor"].includes(a.account_type));
  const dealer = dealers.find((d) => d.id === Number(dealerId));

  const calc = useMemo(() => {
    const items = lines.map((l) => {
      const p = data.products.find((x) => x.id === l.productId);
      return { product: p, qty: Math.max(1, l.qty), total: p ? Number(p.unit_price_pkr) * Math.max(1, l.qty) : 0 };
    });
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const promoRate = subtotal >= 1000000 ? 0.075 : 0;
    const discount = Math.round(subtotal * promoRate);
    return { items, subtotal, promoRate, discount, total: subtotal - discount };
  }, [lines, data.products]);

  const available = dealer ? Number(dealer.credit_limit_pkr) - Number(dealer.current_balance_pkr) : 0;
  const utilisation = dealer ? Math.round((Number(dealer.current_balance_pkr) / Math.max(1, Number(dealer.credit_limit_pkr))) * 100) : 0;

  function setLine(index: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    setCreditError(null);
    if (!dealerId) return toast("Select a dealer first", "error");
    setLoading(true);
    try {
      const res = await api("/demo/orders", {
        method: "POST",
        body: JSON.stringify({ dealerAccountId: dealerId, items: lines, paymentStatus: payment }),
      });
      setResult(res);
      await refresh();
      toast(`Order ${res.order.order_number} placed`, "success");
    } catch (err: any) {
      if (err.data?.code === "credit_limit") {
        setCreditError(err.data);
        toast("Credit limit exceeded — adjust the order or payment mode", "error");
      } else {
        toast(err.message, "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Revenue</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950"><ShoppingCart className="h-6 w-6 text-slate-400" /> Dealer portal & secondary sales</h1>
          <p className="mt-1 text-sm text-slate-500">Bulk order with live credit-limit checks and seasonal trade promotion.</p>
        </div>
        <Badge tone="indigo">{money(data.metrics.orderValue, true)} booked</Badge>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader title="Place a dealer order" subtitle="Credit limit and promo applied automatically" icon={<Plus className="h-4 w-4" />} />
          <form onSubmit={submit} className="space-y-4 p-5">
            <Field label="Dealer / distributor">
              <Select value={dealerId} onChange={(e) => setDealerId(e.target.value ? Number(e.target.value) : "")}>
                <option value="">Select a dealer</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.city} ({d.tier})</option>)}
              </Select>
            </Field>

            {dealer ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Credit utilisation</span>
                  <span className="font-bold text-slate-900">{utilisation}%</span>
                </div>
                <div className="mt-2"><Progress value={utilisation} tone={utilisation >= 95 ? "rose" : utilisation >= 80 ? "amber" : "emerald"} /></div>
                <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                  <span>Used {money(dealer.current_balance_pkr, true)}</span>
                  <span>Available {money(available, true)}</span>
                </div>
              </div>
            ) : null}

            <div>
              <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Order lines</div>
              <div className="space-y-2">
                {lines.map((line, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select value={line.productId} onChange={(e) => setLine(i, { productId: Number(e.target.value) })} className="flex-1">
                      {data.products.map((p) => <option key={p.id} value={p.id}>{p.name} — {money(p.unit_price_pkr)}</option>)}
                    </Select>
                    <Input type="number" min={1} value={line.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} className="w-20" />
                    <button type="button" onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600" disabled={lines.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setLines((ls) => [...ls, { productId: 1, qty: 5 }])} className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add line
              </button>
            </div>

            <Field label="Payment mode">
              <Select value={payment} onChange={(e) => setPayment(e.target.value)}>
                <option>Credit</option>
                <option>Paid</option>
                <option>BNPL</option>
              </Select>
            </Field>

            <div className="rounded-xl border border-slate-200 p-4 text-xs">
              <div className="flex justify-between py-0.5 text-slate-600"><span>Subtotal</span><span className="font-semibold text-slate-900">{money(calc.subtotal)}</span></div>
              <div className="flex justify-between py-0.5 text-slate-600"><span>Summer trade promo {calc.promoRate ? `(${calc.promoRate * 100}%)` : ""}</span><span className="font-semibold text-emerald-600">− {money(calc.discount)}</span></div>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-slate-900"><span>Total</span><span>{money(calc.total)}</span></div>
              {calc.promoRate === 0 ? <div className="mt-1 text-[11px] text-slate-400">Spend PKR 1,000,000+ to unlock the 7.5% seasonal promo.</div> : null}
            </div>

            {creditError ? (
              <Alert tone="rose">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4" />
                  <div>
                    <div className="font-semibold">Credit limit exceeded</div>
                    <div className="mt-0.5 text-xs">Shortfall {money(creditError.credit.shortfall)}. Available {money(creditError.credit.available)}. Reduce quantity or switch to Paid / BNPL.</div>
                  </div>
                </div>
              </Alert>
            ) : null}

            <Button type="submit" loading={loading} className="w-full"><Wallet className="h-4 w-4" /> Place order</Button>
          </form>
        </Card>

        <div className="space-y-4">
          {result ? (
            <Card className="border-emerald-200 bg-emerald-50/50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4" /> Order {result.order.order_number} dispatched</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Total</div><div className="mt-0.5 font-bold text-slate-900">{money(result.order.total_amount_pkr)}</div></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Promo saved</div><div className="mt-0.5 font-bold text-slate-900">{money(result.pricing.discount)}</div></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Payment</div><div className="mt-0.5 font-bold text-slate-900">{result.order.payment_status}</div></div>
                <div><div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Credit after</div><div className="mt-0.5 font-bold text-slate-900">{money(result.credit.after, true)}</div></div>
              </div>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Recent channel orders" subtitle="Primary and secondary sales" icon={<ShoppingCart className="h-4 w-4" />} />
            {data.orders.length === 0 ? (
              <Empty title="No orders yet" />
            ) : (
              <div className="max-h-[520px] divide-y divide-slate-100 overflow-y-auto">
                {data.orders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900">{o.order_number}</div>
                      <div className="text-[11px] text-slate-500">{o.account_name} · {o.order_type} · {dateShort(o.created_at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">{money(o.total_amount_pkr, true)}</div>
                      <div className="mt-1 flex justify-end gap-1">
                        <Badge tone={statusTone(o.payment_status)}>{o.payment_status}</Badge>
                        <Badge tone={statusTone(o.order_status)}>{o.order_status}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
