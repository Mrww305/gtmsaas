import React, { useMemo, useState } from "react";
import { CheckCircle2, MapPin, Navigation, Phone, Smartphone, Star, Wrench } from "lucide-react";
import { useDemo } from "../store";
import { api, timeShort } from "../api";
import { Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, Select, Textarea, statusTone } from "../ui";
import { SignaturePad } from "./Tickets";

export default function FieldView() {
  const { data, refresh, toast } = useDemo();
  const [techId, setTechId] = useState<number>(data?.technicians?.[0]?.id || 1);
  const [selected, setSelected] = useState<any>(null);
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [parts, setParts] = useState("");
  const [busy, setBusy] = useState(false);
  const [visit, setVisit] = useState({ accountId: "", notes: "" });
  const [visits, setVisits] = useState<Array<{ account: string; notes: string; time: string }>>(() => {
    try { return JSON.parse(localStorage.getItem("demo_field_visits") || "[]"); } catch { return []; }
  });

  if (!data) return null;

  const tech = data.technicians.find((t) => t.id === techId) || data.technicians[0];
  const jobs = useMemo(() => data.tickets.filter((t) => t.assigned_technician_id === techId), [data.tickets, techId]);
  const openJobs = jobs.filter((j) => j.status !== "Resolved");
  const selectedLive = selected ? data.tickets.find((t) => t.id === selected.id) || selected : null;

  async function resolve() {
    if (!selectedLive) return;
    if (!signature) return toast("Customer signature is required", "error");
    setBusy(true);
    try {
      await api(`/demo/tickets/${selectedLive.id}/resolve`, { method: "POST", body: JSON.stringify({ signature, notes, partsUsed: parts }) });
      await refresh();
      setSelected(null);
      setSignature("");
      setNotes("");
      setParts("");
      toast("Job completed and synced to dispatch", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  function logVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!visit.accountId) return toast("Select a dealer", "error");
    const account = data.accounts.find((a) => a.id === Number(visit.accountId));
    const next = [{ account: account?.name || "Dealer", notes: visit.notes || "Routine visit", time: new Date().toLocaleString("en-GB") }, ...visits].slice(0, 8);
    setVisits(next);
    localStorage.setItem("demo_field_visits", JSON.stringify(next));
    setVisit({ accountId: "", notes: "" });
    toast("Dealer visit logged on this device", "success");
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Mobile field view</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950"><Smartphone className="h-6 w-6 text-slate-400" /> Technician & sales rep</h1>
          <p className="mt-1 text-sm text-slate-500">A responsive workspace for jobs, dealer visits and customer sign-off.</p>
        </div>
        <Select value={techId} onChange={(e) => setTechId(Number(e.target.value))} className="w-64">
          {data.technicians.map((t) => <option key={t.id} value={t.id}>{t.name} — {t.city}</option>)}
        </Select>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="mx-auto w-full max-w-sm">
          <div className="rounded-[2rem] border-[6px] border-slate-900 bg-slate-900 p-1 shadow-2xl">
            <div className="overflow-hidden rounded-[1.6rem] bg-slate-50">
              <div className="bg-slate-900 px-4 pb-4 pt-3 text-white">
                <div className="mx-auto mb-2 h-1 w-16 rounded-full bg-slate-700" />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-400">Enviro Field</div>
                    <div className="text-sm font-semibold">{tech?.name}</div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold">{(tech?.name || "T").split(" ").map((n) => n[0]).join("")}</div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-white/10 px-1 py-1.5"><div className="text-sm font-bold">{openJobs.length}</div><div className="text-[9px] text-slate-300">open</div></div>
                  <div className="rounded-lg bg-white/10 px-1 py-1.5"><div className="text-sm font-bold">{jobs.length - openJobs.length}</div><div className="text-[9px] text-slate-300">done</div></div>
                  <div className="rounded-lg bg-white/10 px-1 py-1.5"><div className="text-sm font-bold">{tech?.city}</div><div className="text-[9px] text-slate-300">zone</div></div>
                </div>
              </div>
              <div className="max-h-[430px] space-y-2 overflow-y-auto p-3">
                {jobs.length === 0 ? (
                  <div className="px-4 py-10 text-center text-xs text-slate-500">No jobs assigned to {tech?.name}.</div>
                ) : (
                  jobs.map((j) => (
                    <button key={j.id} onClick={() => { setSelected(j); setSignature(""); }} className="w-full rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[0.99]">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-900">{j.ticket_number}</span>
                        <Badge tone={statusTone(j.status)}>{j.status === "Technician Dispatched" ? "Assigned" : j.status}</Badge>
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-800">{j.issue_type} · {j.product_name}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{j.contact_name} · {j.city}</div>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {j.phone_whatsapp}</span>
                        <span>SLA {timeShort(j.sla_deadline)}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className="border-t border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-white">
                  <span className="text-[11px] font-semibold">Today's route</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300"><Navigation className="h-3 w-3" /> Optimised</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Assigned jobs" subtitle={`${jobs.length} jobs for ${tech?.name}`} icon={<Wrench className="h-4 w-4" />} />
            {jobs.length === 0 ? (
              <Empty title="No jobs assigned" hint="Switch technician or create a WhatsApp ticket first." />
            ) : (
              <div className="divide-y divide-slate-100">
                {jobs.map((j) => (
                  <div key={j.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><MapPin className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900">{j.ticket_number} · {j.contact_name}</div>
                      <div className="text-[11px] text-slate-500">{j.issue_type} · {j.city} · {j.product_name}</div>
                    </div>
                    <Badge tone={statusTone(j.status)}>{j.status}</Badge>
                    <Button size="sm" variant="secondary" onClick={() => { setSelected(j); setSignature(""); }}>Open</Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="Log a dealer visit" subtitle="Captured on the rep's device" icon={<Star className="h-4 w-4" />} />
            <form onSubmit={logVisit} className="space-y-3 p-5">
              <Field label="Dealer">
                <Select value={visit.accountId} onChange={(e) => setVisit((v) => ({ ...v, accountId: e.target.value }))}>
                  <option value="">Select a dealer</option>
                  {data.accounts.filter((a) => a.account_type === "Retail Dealer").map((a) => <option key={a.id} value={a.id}>{a.name} — {a.city}</option>)}
                </Select>
              </Field>
              <Field label="Visit notes">
                <Textarea value={visit.notes} onChange={(e) => setVisit((v) => ({ ...v, notes: e.target.value }))} placeholder="Stock check, promo briefing, display audit…" />
              </Field>
              <Button type="submit" variant="secondary" className="w-full">Save visit log</Button>
            </form>
            {visits.length ? (
              <div className="border-t border-slate-100 px-5 py-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recent visits</div>
                <div className="mt-2 space-y-1.5">
                  {visits.map((v, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 text-[11px]">
                      <div><span className="font-semibold text-slate-800">{v.account}</span><span className="text-slate-500"> — {v.notes}</span></div>
                      <span className="shrink-0 text-slate-400">{v.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>
        </div>
      </div>

      <Modal open={!!selectedLive} onClose={() => setSelected(null)} title={selectedLive?.ticket_number || "Job"} subtitle="Complete the job with customer sign-off" width="max-w-lg">
        {selectedLive ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 p-3 text-xs">
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Customer</span><span className="font-semibold text-slate-900">{selectedLive.contact_name}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Product</span><span className="font-semibold text-slate-900">{selectedLive.product_name}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Serial</span><span className="font-mono text-[11px] font-semibold text-slate-900">{selectedLive.serial_number}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-slate-500">Issue</span><span className="font-semibold text-slate-900">{selectedLive.issue_type}</span></div>
            </div>
            {selectedLive.status === "Resolved" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">Already resolved {timeShort(selectedLive.resolved_at)}</div>
            ) : (
              <>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Field label="Parts used"><Input value={parts} onChange={(e) => setParts(e.target.value)} placeholder="Capacitor, gas" /></Field>
                  <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tested 30 min" /></Field>
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer signature</div>
                  <SignaturePad onChange={setSignature} />
                </div>
                <Button className="w-full" onClick={resolve} loading={busy}><CheckCircle2 className="h-4 w-4" /> Complete job</Button>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
