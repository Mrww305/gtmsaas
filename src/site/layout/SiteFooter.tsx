import { Link } from "react-router-dom";
import { Mail, Shield, Zap } from "lucide-react";
import { SITE, SOLUTION_PAGES } from "../seo/routes";

const product = [
  { label: "Platform", href: "/platform" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  { label: "Live demo", href: "/demo" },
];

const company = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
];

function Column({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link to={link.href} className="text-sm text-slate-400 transition hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-slate-950 py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
                <Zap className="h-4 w-4 text-white" />
              </span>
              <span className="text-lg font-bold text-white">RevFlow</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              The revenue operating system for multi-entity groups. Unify B2C appliance velocity and B2B
              conglomerate deals on one visual canvas.
            </p>
            <a
              href={`mailto:${SITE.email}`}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:border-violet-500/30 hover:bg-white/10"
            >
              <Mail className="h-4 w-4 text-violet-400" />
              {SITE.email}
            </a>
          </div>

          <Column title="Product" links={product} />
          <Column
            title="Solutions"
            links={SOLUTION_PAGES.map((s) => ({ label: s.name, href: s.path }))}
          />
          <Column title="Company" links={company} />
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            © {2026} RevFlow. A{" "}
            <a
              href="https://megnitoo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline-offset-2 hover:text-white hover:underline"
            >
              Megnitoo.com
            </a>{" "}
            venture. Built by {SITE.author}.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5" /> GDPR-ready
            </span>
            <span aria-hidden="true">·</span>
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
