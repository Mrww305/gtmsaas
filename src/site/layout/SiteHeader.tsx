import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import { NAV_LINKS } from "../seo/routes";

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="RevFlow home">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400">
        <Zap className="h-4 w-4 text-white" />
      </span>
      <span className="text-lg font-bold tracking-tight text-white">RevFlow</span>
    </Link>
  );
}

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled || open
          ? "border-b border-white/5 bg-slate-950/90 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Brand />

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              to={link.href}
              className={({ isActive }) =>
                `text-sm transition ${isActive ? "font-semibold text-white" : "text-slate-300 hover:text-white"}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link to="/demo" className="text-sm font-semibold text-violet-300 transition hover:text-white">
            Live demo
          </Link>
          <Link
            to="/demo/signup"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Start free
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg p-1.5 text-slate-200 hover:bg-white/5 md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/5 bg-slate-950/95 px-5 pb-5 pt-3 md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="rounded-lg px-2 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/contact" className="rounded-lg px-2 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
              Contact
            </Link>
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to="/demo"
              className="rounded-xl border border-white/10 px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              Open the live demo
            </Link>
            <Link
              to="/demo/signup"
              className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2.5 text-center text-sm font-medium text-white"
            >
              Start free
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
