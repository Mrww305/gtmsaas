import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Sparkles,
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { api, User } from "./api";
import { useAuth } from "./auth";
import { DemoContext, DemoData } from "./store";
import { MODULES, ModuleId, PERSONAS, PersonaId, SECTIONS } from "./nav";
import { Badge, Button, Card, Spinner, cn } from "./ui";
import Overview from "./pages/Overview";
import Directory from "./pages/Directory";
import Opportunities from "./pages/Opportunities";
import Orders from "./pages/Orders";
import Tickets from "./pages/Tickets";
import FieldView from "./pages/FieldView";
import Erp from "./pages/Erp";
import ActivityPage from "./pages/ActivityPage";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

function ToastStack({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? AlertCircle : Info;
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg",
              t.tone === "success" && "border-emerald-200 bg-white text-emerald-900",
              t.tone === "error" && "border-rose-200 bg-white text-rose-900",
              t.tone === "info" && "border-slate-200 bg-white text-slate-800"
            )}
          >
            <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", t.tone === "success" ? "text-emerald-600" : t.tone === "error" ? "text-rose-600" : "text-slate-500")} />
            <div className="flex-1">{t.message}</div>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-700"><X className="h-3.5 w-3.5" /></button>
          </div>
        );
      })}
    </div>
  );
}

function PersonaMenu({ persona, setPersona }: { persona: PersonaId; setPersona: (p: PersonaId) => void }) {
  const [open, setOpen] = useState(false);
  const current = PERSONAS[persona];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-left shadow-sm hover:bg-slate-50"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><current.icon className="h-4 w-4" /></div>
        <div className="hidden leading-tight sm:block">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Viewing as</div>
          <div className="text-xs font-semibold text-slate-800">{current.short}</div>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Switch demo persona</div>
            {(Object.keys(PERSONAS) as PersonaId[]).map((id) => {
              const p = PERSONAS[id];
              return (
                <button
                  key={id}
                  onClick={() => { setPersona(id); setOpen(false); }}
                  className={cn("flex w-full items-start gap-2.5 px-3 py-2.5 text-left hover:bg-slate-50", id === persona && "bg-indigo-50/60")}
                >
                  <div className={cn("mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg", id === persona ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600")}>
                    <p.icon className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">{p.label}</div>
                    <div className="text-[11px] text-slate-500">{p.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [persona, setPersonaState] = useState<PersonaId>(() => (localStorage.getItem("demo_persona") as PersonaId) || "executive");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const moduleId = (location.pathname.replace("/demo/app/", "").split("/")[0] || PERSONAS[persona].defaultModule) as ModuleId;

  const toast = useCallback((message: string, tone: "success" | "error" | "info" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await api<DemoData>("/demo/bootstrap");
      setData(res);
      setError("");
    } catch (err: any) {
      if (err.status === 403) {
        if (err.data?.code === "onboarding") navigate("/demo/onboarding");
        else if (err.data?.code === "unverified") navigate("/demo/verify");
        else setError(err.message);
      } else if (err.status === 401) {
        navigate("/demo/login");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { refresh(); }, [refresh]);

  const setPersona = useCallback(
    (p: PersonaId) => {
      setPersonaState(p);
      localStorage.setItem("demo_persona", p);
      if (!PERSONAS[p].modules.includes(moduleId)) navigate(`/demo/app/${PERSONAS[p].defaultModule}`);
    },
    [moduleId, navigate]
  );

  useEffect(() => {
    if (!PERSONAS[persona].modules.includes(moduleId)) {
      navigate(`/demo/app/${PERSONAS[persona].defaultModule}`, { replace: true });
    }
  }, [moduleId, persona, navigate]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const allowed = useMemo(() => new Set(PERSONAS[persona].modules), [persona]);
  const navBySection = useMemo(
    () =>
      SECTIONS.map((section) => ({
        section,
        items: (Object.keys(MODULES) as ModuleId[]).filter((id) => MODULES[id].section === section && allowed.has(id)),
      })).filter((s) => s.items.length),
    [allowed]
  );

  const usageTotal = data?.usage?.reduce((s, u) => s + Number(u.count), 0) || 0;

  function renderModule() {
    if (!data) return null;
    switch (moduleId) {
      case "overview": return <Overview />;
      case "accounts":
      case "contacts":
      case "catalog":
      case "assets": return <Directory module={moduleId} />;
      case "opportunities": return <Opportunities />;
      case "orders": return <Orders />;
      case "tickets": return <Tickets />;
      case "field": return <FieldView />;
      case "erp": return <Erp />;
      case "activity": return <ActivityPage />;
      default: return <Overview />;
    }
  }

  return (
    <DemoContext.Provider value={{ data, loading, error, refresh, toast }}>
      <div className="flex min-h-screen bg-slate-50">
        {/* Sidebar */}
        <aside className={cn("fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
            <Link to="/demo" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 text-white"><Zap className="h-4 w-4" /></div>
              <div className="leading-tight">
                <div className="text-sm font-bold text-slate-900">RevFlow</div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">JW × Enviro</div>
              </div>
            </Link>
            <button onClick={() => setMobileOpen(false)} className="lg:hidden"><X className="h-4 w-4 text-slate-500" /></button>
          </div>

          <div className="px-3 py-3">
            <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <div className="text-[11px] font-semibold text-indigo-900">Live demo workspace</div>
            </div>
          </div>

          <nav className="h-[calc(100vh-13.5rem)] overflow-y-auto px-3 pb-4">
            {navBySection.map((group) => (
              <div key={group.section} className="mb-4">
                <div className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{group.section}</div>
                <div className="space-y-0.5">
                  {group.items.map((id) => {
                    const m = MODULES[id];
                    const active = id === moduleId;
                    return (
                      <Link
                        key={id}
                        to={`/demo/app/${id}`}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold transition",
                          active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                      >
                        <m.icon className={cn("h-4 w-4", active ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                        <span className="flex-1">{m.label}</span>
                        {active ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="absolute inset-x-0 bottom-0 border-t border-slate-100 bg-white p-3">
            <div className="rounded-xl border border-slate-200 px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Demo access</div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{data?.meta.demoDays || 14}-day workspace</span>
                <Badge tone={usageTotal > 20 ? "amber" : "emerald"}>{usageTotal} actions</Badge>
              </div>
            </div>
          </div>
        </aside>

        {mobileOpen ? <div className="fixed inset-0 z-40 bg-slate-950/30 lg:hidden" onClick={() => setMobileOpen(false)} /> : null}

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
              <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"><Menu className="h-5 w-5" /></button>
              <div className="hidden min-w-0 items-center gap-2 text-xs text-slate-400 sm:flex">
                <span className="font-semibold text-slate-500">JW × Enviro</span>
                <span>/</span>
                <span className="font-semibold text-slate-900">{MODULES[moduleId]?.label || "Overview"}</span>
              </div>
              <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input placeholder="Search accounts, tickets, SKUs…" className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:bg-white" />
              </div>
              <PersonaMenu persona={persona} setPersona={setPersona} />
              <button className="relative rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <Bell className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
              </button>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 py-1 pl-1 pr-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-[11px] font-bold text-white">
                  {(user?.name || "U").split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div className="hidden leading-tight md:block">
                  <div className="text-[11px] font-semibold text-slate-900">{user?.name}</div>
                  <div className="text-[10px] text-slate-400">{user?.email}</div>
                </div>
                <button onClick={async () => { await logout(); navigate("/demo"); }} title="Sign out" className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
            {loading ? (
              <Spinner label="Loading demo data" />
            ) : error ? (
              <Card className="p-6">
                <div className="text-sm font-semibold text-rose-700">Could not load the demo</div>
                <p className="mt-1 text-xs text-slate-500">{error}</p>
                <Button className="mt-3" onClick={refresh}>Retry</Button>
              </Card>
            ) : (
              renderModule()
            )}
          </main>

          <footer className="border-t border-slate-200 px-6 py-4 text-[11px] text-slate-400">
            Demo data is seeded for JW Corporation × Enviro Pakistan. Actions are logged and reset daily. Not connected to production ERP.
          </footer>
        </div>
      </div>
      <ToastStack toasts={toasts} dismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </DemoContext.Provider>
  );
}
