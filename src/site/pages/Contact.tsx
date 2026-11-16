import { useState } from "react";
import { CheckCircle2, Mail, MapPin, MessageSquare, Send } from "lucide-react";
import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { PageHero, Section, SectionHeading } from "../components/Sections";
import { SITE } from "../seo/routes";

type State = "idle" | "sending" | "done";

const field =
  "w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20";

const label = "mb-1.5 block text-xs font-semibold text-slate-300";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", phone: "", message: "" });
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Enter a valid work email.");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "site_contact" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not send your request.");
      setState("done");
    } catch (err: any) {
      setError(err.message || "Could not send your request. Please try again.");
      setState("idle");
    }
  }

  return (
    <SiteLayout>
      <Seo path="/contact" crumbs={[{ name: "Contact", path: "/contact" }]} />
      <PageHero
        eyebrow="Contact"
        title="Tell us what breaks across your entities"
        intro="Book a guided walkthrough, ask about enterprise deployment, or send us the workflow that is currently living in a spreadsheet. Every message reaches the founder directly."
        crumbs={[{ name: "Contact", path: "/contact" }]}
      />

      <Section>
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-6 sm:p-8">
            <SectionHeading eyebrow="Request a demo" title="Send a short brief" />
            {state === "done" ? (
              <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-6 py-12 text-center">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
                <h3 className="text-base font-semibold text-white">Request received</h3>
                <p className="max-w-sm text-sm text-slate-400">
                  We will reply from {SITE.email}. If you want to explore immediately, the demo is open now.
                </p>
                <a
                  href="/demo"
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Open the live demo
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="name">
                      Full name
                    </label>
                    <input
                      id="name"
                      className={field}
                      value={form.name}
                      onChange={set("name")}
                      placeholder="Sajid Afridi"
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="email">
                      Work email
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className={field}
                      value={form.email}
                      onChange={set("email")}
                      placeholder="you@company.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="company">
                      Company
                    </label>
                    <input
                      id="company"
                      className={field}
                      value={form.company}
                      onChange={set("company")}
                      placeholder="JW Corporation"
                      autoComplete="organization"
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="phone">
                      Phone / WhatsApp
                    </label>
                    <input
                      id="phone"
                      className={field}
                      value={form.phone}
                      onChange={set("phone")}
                      placeholder="+92 300 1234567"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div>
                  <label className={label} htmlFor="message">
                    What would you like to see?
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className={field}
                    value={form.message}
                    onChange={set("message")}
                    placeholder="Dealer credit control, warranty dispatch, cross-entity reporting…"
                  />
                </div>
                {error ? (
                  <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {state === "sending" ? "Sending…" : "Request a guided demo"}
                </button>
                <p className="text-center text-[11px] text-slate-500">
                  Goes directly to {SITE.email}. We do not share your details.
                </p>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold text-white">Direct</h3>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                <Mail className="h-4 w-4 text-violet-300" />
                {SITE.email}
              </a>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">
                Best for enterprise scoping, procurement questions and anything that needs a paper trail.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold text-white">Fastest path</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                The demo is fully functional. Create an account, verify your email and you can run all four flows in
                about two minutes.
              </p>
              <a
                href="/demo/signup"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Create a demo account
              </a>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
              <h3 className="text-sm font-semibold text-white">Where we work</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-violet-300" /> Lahore · Karachi · Islamabad
                </li>
                <li className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-violet-300" /> Remote-first delivery
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Section>
    </SiteLayout>
  );
}
