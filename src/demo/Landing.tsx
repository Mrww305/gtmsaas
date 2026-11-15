import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Headphones,
  Lock,
  Plug,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Store,
  Target,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import LeadForm from "./LeadForm";
import { Badge, Button, Card } from "./ui";

const personas = [
  {
    icon: Building2,
    title: "JW Group Executive",
    tag: "Holding level",
    body: "Cross-entity revenue, institutional B2B pipeline and conglomerate-wide analytics in one view.",
  },
  {
    icon: Store,
    title: "Enviro Sales & Channel Manager",
    tag: "Distribution",
    body: "Secondary sales across 150+ branches, dealer credit limits and seasonal AC/appliance targets.",
  },
  {
    icon: Headphones,
    title: "Enviro Service Dispatcher",
    tag: "Field service",
    body: "WhatsApp and web warranty tickets, serial validation, SLA clocks and technician assignment.",
  },
  {
    icon: Smartphone,
    title: "Field Technician / Sales Rep",
    tag: "Mobile view",
    body: "A responsive mobile workspace to log installations, repairs, dealer visits and signatures.",
  },
];

const flows = [
  { icon: Wrench, title: "Omnichannel warranty & dispatch", body: "WhatsApp complaint → asset lookup by phone → warranty check → ticket → technician on map → resolve with signature." },
  { icon: ShoppingCart, title: "Dealer portal & secondary sales", body: "Bulk summer order → live credit-limit check → seasonal trade promotion → dispatched order in one click." },
  { icon: Target, title: "Cross-vertical B2B bundling", body: "Open a JW-SEZ opportunity and get a rule-based cross-sell bundle: land + Forland fleet + Enviro cooling." },
  { icon: Plug, title: "ERP sync simulator", body: "Switch SAP S/4HANA, Oracle NetSuite or Dynamics 365 and watch invoice, inventory and GL payloads stream live." },
];

const entities = [
  ["Entity_Vertical", "Enviro Pakistan · JW-SEZ · JW Forland · RD Pvt Ltd"],
  ["Account", "Retail dealers, distributors, corporate B2B, industrial tenants"],
  ["Contact", "End consumers, dealer owners, procurement heads"],
  ["Product_Catalog", "Inverter ACs, geysers, air fryers, trucks, industrial land"],
  ["Customer_Asset", "Serial + warranty registry across 150+ branches"],
  ["B2B_Opportunity", "Institutional pipeline with cross-sell flags"],
  ["Channel_Order", "Primary and secondary sales with credit control"],
  ["Service_Ticket", "WhatsApp, call center and web warranty dispatch"],
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <Link to="/demo" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white shadow-sm">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-slate-900">RevFlow</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">JW × Enviro demo</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#personas" className="hover:text-slate-900">Personas</a>
            <a href="#flows" className="hover:text-slate-900">Live flows</a>
            <a href="#access" className="hover:text-slate-900">Get access</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/demo/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/demo/signup"><Button size="sm">Create demo account</Button></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_70%_0%,rgba(79,70,229,0.10),transparent_60%),radial-gradient(40%_50%_at_10%_20%,rgba(14,165,233,0.10),transparent_60%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
            <div>
              <Badge tone="indigo" className="mb-5">
                <Sparkles className="h-3 w-3" /> Live interactive demo · no setup required
              </Badge>
              <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-slate-950 sm:text-5xl">
                Run JW Corporation and Enviro Pakistan from one{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">revenue operating system</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                A multi-tenant GTM and field-service demo built for high-velocity B2C appliance operations and high-value B2B
                conglomerate deals. Switch personas, run real workflows and see Pakistani seed data across eight connected entities.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to="/demo/signup"><Button size="lg">Create free demo account <ArrowRight className="h-4 w-4" /></Button></Link>
                <a href="#flows"><Button size="lg" variant="secondary">See the four flows</Button></a>
              </div>
              <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-center">
                {[["4", "live personas"], ["8", "core entities"], ["4", "end-to-end flows"]].map(([n, l]) => (
                  <div key={l} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                    <div className="text-xl font-bold text-slate-900">{n}</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Email-verified access</span>
                <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-emerald-500" /> Isolated demo workspace</span>
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-500" /> 14-day retention</span>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Demo workspace preview
                </div>
                <div className="mt-2 text-lg font-semibold">Holding-level overview</div>
                <div className="mt-1 text-xs text-slate-400">Cross-entity pipeline, credit exposure and open SLA tickets</div>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  ["Open pipeline", "PKR 389.5M"],
                  ["Closed won", "PKR 178.0M"],
                  ["Open SLA tickets", "6"],
                  ["Credit at risk", "2 accounts"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{k}</div>
                    <div className="mt-1 text-lg font-bold text-slate-900">{v}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-slate-100 px-5 py-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Persona switcher</span>
                  <span className="text-slate-400">live in the demo</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Executive", "Channel", "Dispatcher", "Field rep"].map((p) => (
                    <span key={p} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{p}</span>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="personas" className="mx-auto max-w-7xl px-5 py-16">
          <div className="mb-8 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Role-based access</div>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Four personas, one source of truth</h2>
            <p className="mt-2 text-sm text-slate-600">Switch personas live during a presentation. Navigation, KPIs and actions change with the role.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {personas.map((p) => (
              <Card key={p.title} className="p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><p.icon className="h-5 w-5" /></div>
                <div className="mt-3 text-sm font-semibold text-slate-900">{p.title}</div>
                <Badge tone="slate" className="mt-1.5">{p.tag}</Badge>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{p.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section id="flows" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-16">
            <div className="mb-8 max-w-2xl">
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Clickable end-to-end flows</div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Not static CRUD screens</h2>
              <p className="mt-2 text-sm text-slate-600">Each flow writes to the database, enforces prerequisites and updates the dashboards in real time.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {flows.map((f, i) => (
                <Card key={f.title} className="flex gap-4 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white"><f.icon className="h-5 w-5" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">FLOW {i + 1}</span>
                      <span className="text-sm font-semibold text-slate-900">{f.title}</span>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{f.body}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Data model</div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Eight connected entities</h2>
              <p className="mt-2 text-sm text-slate-600">
                Realistic Pakistani seed data: Lahore, Karachi and Islamabad branches, PKR currency, and appliance SKUs like the
                1.5 Ton Inverter AC and Instant Geyser.
              </p>
              <div className="mt-6 space-y-2.5">
                {entities.map(([name, body]) => (
                  <div key={name} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                    <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                    <div>
                      <div className="font-mono text-xs font-semibold text-slate-900">{name}</div>
                      <div className="text-xs text-slate-500">{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div id="access" className="space-y-5">
              <Card className="p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Users className="h-4 w-4 text-indigo-600" /> Get instant demo access</div>
                <p className="mt-1 text-xs text-slate-500">Create an account, verify your email and complete a 3-step onboarding.</p>
                <div className="mt-5 space-y-3">
                  {[
                    "Email verification (6-digit code)",
                    "Accept demo terms and data-retention policy",
                    "Onboarding: company, role and use case",
                    "Daily action quotas keep the demo safe",
                  ].map((t) => (
                    <div key={t} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {t}
                    </div>
                  ))}
                </div>
                <Link to="/demo/signup" className="mt-6 block"><Button className="w-full">Create free demo account <ArrowRight className="h-4 w-4" /></Button></Link>
                <div className="mt-3 text-center text-xs text-slate-500">Already have access? <Link to="/demo/login" className="font-semibold text-indigo-600 hover:underline">Sign in</Link></div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Headphones className="h-4 w-4 text-indigo-600" /> Prefer a guided walkthrough?</div>
                <p className="mt-1 mb-4 text-xs text-slate-500">Send your details — the form emails ceo@sajidafridi.com directly.</p>
                <LeadForm source="demo_landing" compact />
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-8 text-xs text-slate-500 sm:flex-row">
          <div>© {new Date().getFullYear()} RevFlow · Built for JW Corporation × Enviro Pakistan</div>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-slate-900">Marketing site</Link>
            <Link to="/demo/login" className="hover:text-slate-900">Sign in</Link>
            <a href="mailto:ceo@sajidafridi.com" className="hover:text-slate-900">ceo@sajidafridi.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
