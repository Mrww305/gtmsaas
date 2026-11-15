import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, KeyRound, Mail, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { api } from "./api";
import { useAuth } from "./auth";
import { Alert, Badge, Button, Card, Field, Input, Select } from "./ui";

function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(79,70,229,0.35),transparent_60%),radial-gradient(50%_40%_at_90%_80%,rgba(14,165,233,0.25),transparent_60%)]" />
        <div className="relative">
          <Link to="/demo" className="inline-flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10"><Zap className="h-4.5 w-4.5" /></div>
            <span className="text-sm font-bold tracking-tight">RevFlow</span>
          </Link>
          <div className="mt-16 max-w-md">
            <Badge tone="indigo" className="mb-4 bg-white/10 text-indigo-200 ring-white/10"><Sparkles className="h-3 w-3" /> JW × Enviro live demo</Badge>
            <h1 className="text-3xl font-bold leading-tight tracking-tight">One revenue operating system for B2C velocity and B2B depth.</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Warranty dispatch, dealer credit control, cross-vertical bundling and ERP sync — all in a single multi-tenant workspace.
            </p>
          </div>
        </div>
        <div className="relative grid grid-cols-2 gap-3 text-xs">
          {[
            ["WhatsApp → dispatch", "Flow 1"],
            ["Dealer credit check", "Flow 2"],
            ["Cross-sell bundles", "Flow 3"],
            ["SAP / NetSuite sync", "Flow 4"],
          ].map(([t, s]) => (
            <div key={t} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">{s}</div>
              <div className="mt-1 font-semibold text-white">{t}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center bg-slate-50 px-5 py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Link to="/demo" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900"><Zap className="h-4 w-4 text-indigo-600" /> RevFlow</Link>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
          {footer ? <div className="mt-5 text-center text-xs text-slate-500">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", company: "", role: "", password: "", terms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.terms) return setError("Please accept the demo terms to continue.");
    setLoading(true);
    try {
      const res = await api<{ email: string; devCode?: string; mailSent: boolean }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      sessionStorage.setItem("demo_email", res.email);
      navigate("/demo/verify", { state: { email: res.email, devCode: res.devCode, mailSent: res.mailSent } });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your demo account"
      subtitle="Verify your email, complete onboarding, and unlock the live workspace."
      footer={<>Already have access? <Link to="/demo/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Full name"><Input required value={form.name} onChange={set("name")} placeholder="Sajid Afridi" autoComplete="name" /></Field>
          <Field label="Work email"><Input required type="email" value={form.email} onChange={set("email")} placeholder="you@company.com" autoComplete="email" /></Field>
          <Field label="Company"><Input value={form.company} onChange={set("company")} placeholder="JW Corporation" autoComplete="organization" /></Field>
          <Field label="Your role">
            <Select value={form.role} onChange={set("role")}>
              <option value="">Select a role</option>
              <option>Executive / Holding</option>
              <option>Sales & Channel</option>
              <option>Service & Support</option>
              <option>Field Operations</option>
              <option>IT / ERP</option>
              <option>Other</option>
            </Select>
          </Field>
        </div>
        <Field label="Password" hint="At least 8 characters.">
          <Input required type="password" minLength={8} value={form.password} onChange={set("password")} placeholder="••••••••" autoComplete="new-password" />
        </Field>
        <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs text-slate-600">
          <input type="checkbox" checked={form.terms} onChange={set("terms")} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600" />
          <span>I accept the demo terms. My data is used only for this sandbox and demo records expire after 14 days.</span>
        </label>
        {error ? <Alert tone="rose">{error}</Alert> : null}
        <Button type="submit" loading={loading} className="w-full">Create demo account <ArrowRight className="h-4 w-4" /></Button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><ShieldCheck className="h-3.5 w-3.5" /> Email verification keeps the demo spam-free</div>
      </form>
    </AuthLayout>
  );
}

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const [form, setForm] = useState({ email: (location.state as any)?.email || "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify(form) });
      const user = await refresh();
      if (user && !user.onboarded) navigate("/demo/onboarding");
      else navigate("/demo/app");
    } catch (err: any) {
      if (err.data?.code === "unverified") {
        sessionStorage.setItem("demo_email", err.data.email || form.email);
        navigate("/demo/verify", { state: { email: err.data.email || form.email } });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in to the demo"
      subtitle="Use the demo account you created."
      footer={<>New here? <Link to="/demo/signup" className="font-semibold text-indigo-600 hover:underline">Create a demo account</Link></>}
    >
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Email"><Input required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@company.com" autoComplete="email" /></Field>
        <Field label="Password"><Input required type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="••••••••" autoComplete="current-password" /></Field>
        {error ? <Alert tone="rose">{error}</Alert> : null}
        <Button type="submit" loading={loading} className="w-full">Sign in <ArrowRight className="h-4 w-4" /></Button>
      </form>
    </AuthLayout>
  );
}

export function Verify() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refresh } = useAuth();
  const state = (location.state || {}) as { email?: string; devCode?: string; mailSent?: boolean };
  const [email, setEmail] = useState(state.email || sessionStorage.getItem("demo_email") || "");
  const [code, setCode] = useState(state.devCode || "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(state.devCode ? "SMTP is not configured yet — use the code below." : "");

  useEffect(() => {
    if (email) sessionStorage.setItem("demo_email", email);
  }, [email]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/verify", { method: "POST", body: JSON.stringify({ email, code }) });
      const user = await refresh();
      if (user && !user.onboarded) navigate("/demo/onboarding");
      else navigate("/demo/app");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError("");
    try {
      const res = await api<{ devCode?: string; mailSent: boolean }>("/auth/resend", { method: "POST", body: JSON.stringify({ email }) });
      if (res.devCode) {
        setCode(res.devCode);
        setInfo("SMTP is not configured yet — use the new code below.");
      } else {
        setInfo("A new code is on its way.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthLayout title="Verify your email" subtitle="Enter the 6-digit code we sent to your inbox." footer={<Link to="/demo/login" className="font-semibold text-indigo-600 hover:underline">Back to sign in</Link>}>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Email"><Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
        <Field label="Verification code">
          <Input
            required
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center text-xl font-bold tracking-[0.5em]"
          />
        </Field>
        {info ? <Alert tone="indigo"><span className="inline-flex items-center gap-1.5"><KeyRound className="h-4 w-4" /> {info}</span></Alert> : null}
        {error ? <Alert tone="rose">{error}</Alert> : null}
        <Button type="submit" loading={loading} className="w-full">Verify and continue <ArrowRight className="h-4 w-4" /></Button>
        <div className="text-center">
          <button type="button" onClick={resend} disabled={resending || !email} className="text-xs font-semibold text-indigo-600 hover:underline disabled:text-slate-400">
            {resending ? "Sending…" : "Resend code"}
          </button>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><Mail className="h-3.5 w-3.5" /> Check spam if it doesn't arrive within a minute</div>
      </form>
    </AuthLayout>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    company: user?.company || "",
    role: user?.role || "",
    useCase: user?.useCase || "",
    teamSize: user?.teamSize || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/auth/onboarding", { method: "POST", body: JSON.stringify(form) });
      await refresh();
      navigate("/demo/app");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Unlock your demo" subtitle="Three quick answers and your workspace is ready.">
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="Company"><Input required value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="JW Corporation" /></Field>
        <Field label="Role">
          <Select required value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            <option value="">Select your role</option>
            <option>Executive / Holding</option>
            <option>Sales & Channel</option>
            <option>Service & Support</option>
            <option>Field Operations</option>
            <option>IT / ERP</option>
            <option>Other</option>
          </Select>
        </Field>
        <Field label="Primary use case">
          <Select value={form.useCase} onChange={(e) => setForm((f) => ({ ...f, useCase: e.target.value }))}>
            <option value="">Select a use case</option>
            <option>Multi-tenant GTM</option>
            <option>Dealer & channel management</option>
            <option>Warranty & field service</option>
            <option>B2B pipeline & bundling</option>
            <option>ERP integration</option>
          </Select>
        </Field>
        <Field label="Team size">
          <Select value={form.teamSize} onChange={(e) => setForm((f) => ({ ...f, teamSize: e.target.value }))}>
            <option value="">Select team size</option>
            <option>1–10</option>
            <option>11–50</option>
            <option>51–200</option>
            <option>200+</option>
          </Select>
        </Field>
        {error ? <Alert tone="rose">{error}</Alert> : null}
        <Button type="submit" loading={loading} className="w-full">Enter the demo <ArrowRight className="h-4 w-4" /></Button>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400"><CheckCircle2 className="h-3.5 w-3.5" /> This unlocks all four flows</div>
      </form>
    </AuthLayout>
  );
}
