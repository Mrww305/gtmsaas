import React, { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { api } from "./api";
import { Alert, Button, Field, Input, Textarea } from "./ui";

export default function LeadForm({
  source = "demo_page",
  compact = false,
  onDone,
}: {
  source?: string;
  compact?: boolean;
  onDone?: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.email) return setError("Enter your work email.");
    setState("sending");
    try {
      await api("/leads", { method: "POST", body: JSON.stringify({ ...form, source }) });
      setState("done");
      onDone?.();
    } catch (err: any) {
      setError(err.message || "Could not send. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        <div className="text-sm font-semibold text-emerald-900">Request received</div>
        <p className="max-w-sm text-xs text-emerald-800">
          Our team will reach out from ceo@sajidafridi.com. You can also create a demo account and explore immediately.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className={compact ? "space-y-3" : "grid gap-3 sm:grid-cols-2"}>
        <Field label="Full name">
          <Input value={form.name} onChange={set("name")} placeholder="Sajid Afridi" autoComplete="name" />
        </Field>
        <Field label="Work email">
          <Input type="email" required value={form.email} onChange={set("email")} placeholder="you@company.com" autoComplete="email" />
        </Field>
        <Field label="Company">
          <Input value={form.company} onChange={set("company")} placeholder="JW Corporation" autoComplete="organization" />
        </Field>
        <Field label="Phone / WhatsApp">
          <Input value={form.phone} onChange={set("phone")} placeholder="+92 300 1234567" autoComplete="tel" />
        </Field>
      </div>
      <Field label="What would you like to see?">
        <Textarea value={form.message} onChange={set("message")} placeholder="Multi-tenant GTM, dealer credit control, warranty dispatch…" />
      </Field>
      {error ? <Alert tone="rose">{error}</Alert> : null}
      <Button type="submit" loading={state === "sending"} className="w-full">
        <Send className="h-4 w-4" /> Request a guided demo
      </Button>
      <p className="text-center text-[11px] text-slate-400">Goes directly to ceo@sajidafridi.com. No spam.</p>
    </form>
  );
}
