import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { NAV_LINKS } from "../seo/routes";

export default function NotFound() {
  return (
    <SiteLayout>
      <Seo path="/404" />
      <section className="relative overflow-hidden bg-slate-950 pb-24 pt-36">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_45%_at_20%_0%,rgba(124,58,237,0.18),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-400">Error 404</span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            This page is not on the canvas
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
            The link may be outdated, or the page moved during the rebuild. Everything below is still live.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <Link
              to="/demo"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Open the live demo
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-2">
            {NAV_LINKS.concat([{ label: "Contact", href: "/contact" }]).map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
