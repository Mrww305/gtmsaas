import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, MapPin, MessageCircle, Phone, Send, ShieldCheck, Smartphone, Wrench, X } from "lucide-react";
import { useDemo } from "../store";
import { api, dateShort, money, timeShort } from "../api";
import { Alert, Badge, Button, Card, CardHeader, Empty, Field, Input, Modal, Select, Textarea, statusTone } from "../ui";

export function SignaturePad({ onChange }: { onChange: (data: string) => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const pos = (e: React.PointerEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  function start(e: React.PointerEvent) {
    e.preventDefault();
    const ctx = ref.current!.getContext("2d")!;
    const p = pos(e);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ref.current!.setPointerCapture(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = ref.current!.getContext("2d")!;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  }
  function end() {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(ref.current!.toDataURL("image/png"));
  }
  function clear() {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange("");
  }

  return (
    <div>
      <div className="relative rounded-xl border border-dashed border-slate-300 bg-slate-50">
        <canvas ref={ref} className="h-36 w-full touch-none rounded-xl" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end} />
        {!hasInk ? <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-slate-400">Customer signs here</div> : null}
      </div>
      <div className="mt-1.5 flex justify-end"><button type="button" onClick={clear} className="text-[11px] font-semibold text-slate-500 hover:text-rose-600">Clear signature</button></div>
    </div>
  );
}

function MiniMap({ tickets, technicians }: { tickets: any[]; technicians: any[] }) {
  const cityCoords: Record<string, [number, number]> = {
    Lahore: [74.3587, 31.5204],
    Karachi: [67.0011, 24.8607],
    Islamabad: [73.0479, 33.6844],
    Rawalpindi: [73.0479, 33.5651],
  };
  const project = (lng: number, lat: number) => ({
    left: `${((lng - 60) / 18) * 100}%`,
    top: `${((37 - lat) / 14) * 100}%`,
  });

  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-slate-200 bg-[linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] bg-[size:32px_32px]">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 to-emerald-50/40" />
      {Object.entries(cityCoords).map(([city, [lng, lat]]) => (
        <div key={city} className="absolute -translate-x-1/2 -translate-y-1/2" style={project(lng, lat)}>
          <div className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200">{city}</div>
        </div>
      ))}
      {technicians.map((t) => (
        <div key={t.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={project(Number(t.lng), Number(t.lat))} title={`${t.name} · ${t.city}`}>
          <span className={`block h-3 w-3 rounded-full ring-4 ${t.status === "on_job" ? "bg-amber-500 ring-amber-100" : "bg-emerald-500 ring-emerald-100"}`} />
        </div>
      ))}
      {tickets.slice(0, 6).map((t) => {
        const c = cityCoords[t.city];
        if (!c) return null;
        return (
          <div key={`t-${t.id}`} className="absolute -translate-x-1/2 -translate-y-1/2" style={project(c[0] + 0.35, c[1] - 0.25)}>
            <span className="block h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-indigo-100" />
          </div>
        );
      })}
      <div className="absolute bottom-2 left-2 flex gap-3 rounded-lg bg-white/90 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 shadow-sm">
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> available</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> on job</span>
        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> ticket</span>
      </div>
    </div>
  );
}

export default function Tickets() {
  const { data, refresh, toast } = useDemo();
  const [phone, setPhone] = useState("+92 300 1234567");
  const [message, setMessage] = useState("Assalam o Alaikum, my Enviro AC is not cooling at all. It is very hot and the warranty card is with me.");
  const [issueType, setIssueType] = useState("Cooling Issue");
  const [sending, setSending] = useState(false);
  const [intake, setIntake] = useState<any>(null);
  const [selected, setSelected] = useState<any>(null);
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [parts, setParts] = useState("");
  const [techId, setTechId] = useState<number | "">("");
  const [busy, setBusy] = useState(false);

  if (!data) return null;

  const open = data.tickets.filter((t) => t.status !== "Resolved");
  const customers = data.contacts.filter((c) => c.contact_type === "End Consumer");

  const selectedLive = selected ? data.tickets.find((t) => t.id === selected.id) || selected : null;

  async function processWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setIntake(null);
    try {
      const res = await api("/demo/tickets/whatsapp", { method: "POST", body: JSON.stringify({ phone, message, issueType }) });
      setIntake(res);
      await refresh();
      toast(`Ticket ${res.ticket.ticket_number} created from WhatsApp`, "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setSending(false);
    }
  }

  async function dispatch() {
    if (!selectedLive || !techId) return toast("Select a technician", "error");
    setBusy(true);
    try {
      await api(`/demo/tickets/${selectedLive.id}/dispatch`, { method: "POST", body: JSON.stringify({ technicianId: techId }) });
      await refresh();
      toast("Technician dispatched", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function resolve() {
    if (!selectedLive) return;
    if (!signature) return toast("Capture the customer signature first", "error");
    setBusy(true);
    try {
      await api(`/demo/tickets/${selectedLive.id}/resolve`, { method: "POST", body: JSON.stringify({ signature, notes, partsUsed: parts }) });
      await refresh();
      setSelected(null);
      setSignature("");
      setNotes("");
      setParts("");
      toast("Job resolved and signed off", "success");
    } catch (err: any) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Service</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950"><Wrench className="h-6 w-6 text-slate-400" /> Warranty & field dispatch</h1>
          <p className="mt-1 text-sm text-slate-500">WhatsApp intake → serial lookup → warranty check → technician assignment → signed resolution.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="amber">{open.length} open</Badge>
          <Badge tone="emerald">{data.metrics.resolvedTickets} resolved</Badge>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader title="WhatsApp intake simulator" subtitle="Send a customer message to the service line" icon={<MessageCircle className="h-4 w-4" />} />
          <div className="p-5">
            <div className="mb-4 rounded-2xl bg-[#e5ddd5] p-3">
              <div className="mx-auto mb-2 w-fit rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-500">Enviro Service · online</div>
              <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#dcf8c6] px-3 py-2 text-xs text-slate-800 shadow-sm">
                {message || "…"}
                <div className="mt-1 text-right text-[9px] text-slate-500">just now ✓✓</div>
              </div>
            </div>

            <form onSubmit={processWhatsApp} className="space-y-3">
              <Field label="Customer WhatsApp number" hint="Try +92 300 1234567 (Ahmed Raza) or +92 321 7654321 (Fatima Khan).">
                <div className="flex gap-2">
                  <Select value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1">
                    {customers.map((c) => <option key={c.id} value={c.phone_whatsapp}>{c.full_name} — {c.phone_whatsapp}</option>)}
                  </Select>
                </div>
              </Field>
              <Field label="Issue type">
                <Select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                  <option>Cooling Issue</option>
                  <option>Gas Refill</option>
                  <option>New Installation</option>
                  <option>DOA</option>
                  <option>General Service</option>
                </Select>
              </Field>
              <Field label="Message">
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} />
              </Field>
              <Button type="submit" loading={sending} className="w-full"><Send className="h-4 w-4" /> Process WhatsApp message</Button>
            </form>

            {intake ? (
              <div className="mt-4 space-y-3">
                <Alert tone={intake.warranty.active ? "emerald" : "amber"}>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4" />
                    <div>
                      <div className="font-semibold">Warranty {intake.warranty.active ? "verified" : "expired / not found"}</div>
                      <div className="mt-0.5 text-xs">
                        {intake.asset ? `${intake.product?.name} · ${intake.warranty.serial} · expires ${dateShort(intake.warranty.expiry)}` : "No registered asset for this contact."}
                      </div>
                    </div>
                  </div>
                </Alert>
                <div className="rounded-xl border border-slate-200 p-4 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{intake.ticket.ticket_number}</span>
                    <Badge tone={statusTone(intake.ticket.status)}>{intake.ticket.status}</Badge>
                  </div>
                  <div className="mt-2 grid gap-1.5 text-slate-600">
                    <div className="flex justify-between"><span>Customer</span><span className="font-semibold text-slate-900">{intake.contact.full_name}</span></div>
                    <div className="flex justify-between"><span>City</span><span className="font-semibold text-slate-900">{intake.contact.city}</span></div>
                    <div className="flex justify-between"><span>SLA deadline</span><span className="font-semibold text-slate-900">{timeShort(intake.ticket.sla_deadline)}</span></div>
                    <div className="flex justify-between"><span>Technician</span><span className="font-semibold text-slate-900">{intake.technician?.name || "Unassigned"}</span></div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Field map" subtitle="Lahore · Karachi · Islamabad coverage" icon={<MapPin className="h-4 w-4" />} />
            <div className="p-4"><MiniMap tickets={open} technicians={data.technicians} /></div>
          </Card>

          <Card>
            <CardHeader title="Ticket queue" subtitle="Click a ticket to dispatch or resolve" icon={<Wrench className="h-4 w-4" />} />
            {data.tickets.length === 0 ? (
              <Empty title="No tickets" />
            ) : (
              <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
                {data.tickets.map((t) => (
                  <button key={t.id} onClick={() => { setSelected(t); setTechId(t.assigned_technician_id || ""); setSignature(""); }} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-slate-50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{t.ticket_number}</span>
                        <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{t.contact_name} · {t.issue_type} · {t.channel} · {t.city}</div>
                    </div>
                    <div className="text-right text-[11px] text-slate-500">
                      <div className="font-semibold text-slate-700">{t.technician_name || "Unassigned"}</div>
                      <div>SLA {timeShort(t.sla_deadline)}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={!!selectedLive} onClose={() => setSelected(null)} title={selectedLive?.ticket_number || "Ticket"} subtitle={`${selectedLive?.channel || ""} · ${selectedLive?.issue_type || ""}`} width="max-w-3xl">
        {selectedLive ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["Customer", selectedLive.contact_name],
                ["Phone", selectedLive.phone_whatsapp],
                ["City", selectedLive.city],
                ["Product", selectedLive.product_name || "—"],
                ["Serial", selectedLive.serial_number || "—"],
                ["Warranty", selectedLive.warranty_verified ? "Verified" : "Not verified"],
                ["Assigned tech", selectedLive.technician_name || "Unassigned"],
                ["SLA", timeShort(selectedLive.sla_deadline)],
                ["Status", selectedLive.status],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</div>
                  <div className="mt-0.5 text-xs font-semibold text-slate-800">{v}</div>
                </div>
              ))}
            </div>

            {selectedLive.status !== "Resolved" ? (
              <>
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-900">Dispatch technician</div>
                  <div className="mt-2 flex gap-2">
                    <Select value={techId} onChange={(e) => setTechId(e.target.value ? Number(e.target.value) : "")} className="flex-1">
                      <option value="">Select technician</option>
                      {data.technicians.filter((t) => t.city === selectedLive.city || t.status === "available").map((t) => (
                        <option key={t.id} value={t.id}>{t.name} — {t.city} ({t.status})</option>
                      ))}
                    </Select>
                    <Button variant="secondary" onClick={dispatch} loading={busy}>Dispatch</Button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-900">Resolve job</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Parts used"><Input value={parts} onChange={(e) => setParts(e.target.value)} placeholder="Run capacitor, gas refill" /></Field>
                    <Field label="Notes"><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tested for 30 minutes" /></Field>
                  </div>
                  <div className="mt-3">
                    <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Customer signature</div>
                    <SignaturePad onChange={setSignature} />
                  </div>
                  <Button className="mt-3 w-full" onClick={resolve} loading={busy}><CheckCircle2 className="h-4 w-4" /> Mark resolved & sign off</Button>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900"><CheckCircle2 className="h-4 w-4" /> Resolved {timeShort(selectedLive.resolved_at)}</div>
                {selectedLive.notes ? <div className="mt-1 text-xs text-emerald-800">{selectedLive.notes}</div> : null}
                {selectedLive.parts_used ? <div className="text-xs text-emerald-800">Parts: {selectedLive.parts_used}</div> : null}
                {selectedLive.signature ? <img src={selectedLive.signature} alt="Customer signature" className="mt-3 h-24 rounded-lg border border-emerald-200 bg-white" /> : null}
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
