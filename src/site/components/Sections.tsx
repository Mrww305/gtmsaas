import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, ChevronRight } from "lucide-react";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <li>
          <Link to="/" className="hover:text-slate-300">
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-slate-600" aria-hidden="true" />
            {i === items.length - 1 ? (
              <span className="text-slate-300">{item.name}</span>
            ) : (
              <Link to={item.path} className="hover:text-slate-300">
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function PageHero({
  eyebrow,
  title,
  intro,
  primary,
  secondary,
  aside,
  crumbs,
}: {
  eyebrow: string;
  title: React.ReactNode;
  intro: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  aside?: React.ReactNode;
  crumbs?: { name: string; path: string }[];
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-slate-950 pb-16 pt-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_0%,rgba(124,58,237,0.22),transparent_60%),radial-gradient(45%_45%_at_85%_10%,rgba(34,211,238,0.16),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
        {crumbs ? <Breadcrumbs items={crumbs} /> : null}
        <div className={aside ? "grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]" : "max-w-3xl"}>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">{eyebrow}</span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">{intro}</p>
            {primary || secondary ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {primary ? (
                  <Link
                    to={primary.href}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {primary.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                {secondary ? (
                  <Link
                    to={secondary.href}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    {secondary.label}
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function Section({
  children,
  id,
  tone = "dark",
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  tone?: "dark" | "darker" | "panel";
  className?: string;
}) {
  const tones = {
    dark: "bg-slate-950",
    darker: "bg-black/30",
    panel: "bg-slate-900/40",
  };
  return (
    <section id={id} className={`${tones[tone]} py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-5 sm:px-6">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}>
      {eyebrow ? (
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">{eyebrow}</span>
      ) : null}
      <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
      {intro ? <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">{intro}</p> : null}
    </div>
  );
}

export function Cards({
  items,
  columns = 3,
}: {
  items: { icon?: React.ComponentType<{ className?: string }>; title: string; body: string; points?: string[] }[];
  columns?: 2 | 3 | 4;
}) {
  const cols = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <div className={`mt-10 grid gap-4 ${cols}`}>
      {items.map((item) => (
        <div
          key={item.title}
          className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 transition hover:border-violet-500/25 hover:bg-slate-900/60"
        >
          {item.icon ? (
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <item.icon className="h-5 w-5" />
            </span>
          ) : null}
          <h3 className="mt-4 text-base font-semibold text-white">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
          {item.points ? (
            <ul className="mt-4 space-y-1.5">
              {item.points.map((p) => (
                <li key={p} className="flex items-start gap-2 text-xs text-slate-400">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  {p}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</dt>
          <dd className="mt-1 text-2xl font-bold text-white">{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Steps({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.title} className="rounded-2xl border border-white/5 bg-slate-900/40 p-5">
          <span className="text-xs font-bold text-violet-400">STEP {i + 1}</span>
          <h3 className="mt-2 text-sm font-semibold text-white">{item.title}</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.body}</p>
        </li>
      ))}
    </ol>
  );
}

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="mt-8 divide-y divide-white/5 rounded-2xl border border-white/5 bg-slate-900/30">
      {items.map((item) => (
        <details key={item.q} className="group px-5 py-4">
          <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-white marker:content-none">
            {item.q}
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition group-open:rotate-90" />
          </summary>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-400">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export function CTABand({
  title = "See it running against real Pakistani data",
  body = "Create a free demo account, switch between four personas and run all four flows end to end. No setup, no credit card.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="bg-slate-950 pb-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-slate-900 to-cyan-500/10 px-6 py-12 sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{body}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/demo/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Create free demo account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Talk to us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl [&_a]:text-violet-300 [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white [&_h3]:mt-6 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_li]:mt-1.5 [&_li]:text-sm [&_li]:leading-relaxed [&_li]:text-slate-400 [&_p]:mt-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-slate-400 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </div>
  );
}
