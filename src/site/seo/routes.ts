export const SITE = {
  url: "https://gtmsaas.sajidafridi.com",
  name: "RevFlow",
  legalName: "RevFlow, a Megnitoo.com venture",
  tagline: "The revenue operating system for multi-entity groups",
  email: "ceo@sajidafridi.com",
  author: "Sajid Afridi",
  twitter: "@mr305afridi",
  locale: "en",
} as const;

export type RouteMeta = {
  path: string;
  title: string;
  description: string;
  priority: number;
  changefreq: "weekly" | "monthly" | "yearly";
  noindex?: boolean;
  /** Client-rendered route: listed in the sitemap but never prerendered. */
  spa?: boolean;
};

/** Every indexable marketing route. Drives the router, the sitemap and prerendering. */
export const ROUTES: RouteMeta[] = [
  {
    path: "/",
    title: "RevFlow — Revenue Operations Platform for Multi-Entity Groups",
    description:
      "One revenue OS for B2C appliance velocity and B2B conglomerate deals: visual GTM canvas, channel DMS, field service and ERP sync.",
    priority: 1,
    changefreq: "weekly",
  },
  {
    path: "/platform",
    title: "Platform — GTM Canvas, Channel DMS & Field Service | RevFlow",
    description:
      "Connect accounts, assets, orders, tickets and ERP records on one visual canvas, with role-based access and a full audit trail.",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/solutions",
    title: "Solutions by Industry — Appliances, Industrial, Fleet, Distribution",
    description:
      "Reference architectures for appliance brands, industrial zones, commercial vehicle fleets and regional distribution networks.",
    priority: 0.9,
    changefreq: "monthly",
  },
  {
    path: "/solutions/enviro-pakistan",
    title: "Appliance Brands — Warranty, Dealers & Field Service | RevFlow",
    description:
      "Run warranty registration, dealer secondary sales, credit control and technician dispatch from one system, built for appliance B2C at scale.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/solutions/jw-sez",
    title: "Industrial Zones & Real Estate — B2B Pipeline | RevFlow",
    description:
      "Track tenant and land pipeline, bundle adjacent products into one quote, and give holding-level leadership cross-entity revenue visibility.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/solutions/jw-forland",
    title: "Commercial Vehicle Fleets — Deal Desk & Service | RevFlow",
    description:
      "Manage fleet deal desks, institutional tenders and after-sales service for commercial vehicle distribution.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/solutions/rd-distribution",
    title: "Regional Distribution — Primary & Secondary Sales | RevFlow",
    description:
      "Give distributors and branch managers live credit limits, seasonal trade promotions and order-to-dispatch visibility across 150+ branches.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/integrations",
    title: "Integrations — SAP, NetSuite, Dynamics, WhatsApp | RevFlow",
    description:
      "Bi-directional ERP sync, WhatsApp warranty intake and map-based dispatch. Inspect the exact payloads before you commit.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/pricing",
    title: "Pricing — Transparent, Usage-Based Plans | RevFlow",
    description:
      "Starter, Growth and Enterprise plans with usage metering, hard caps and a 12-day free trial. No credit card required.",
    priority: 0.8,
    changefreq: "monthly",
  },
  {
    path: "/about",
    title: "About RevFlow — Built by Sajid Afridi & Megnitoo",
    description:
      "RevFlow is a revenue operations platform built in partnership with Megnitoo.com, focused on multi-entity go-to-market execution.",
    priority: 0.6,
    changefreq: "yearly",
  },
  {
    path: "/contact",
    title: "Contact RevFlow — Talk to the Team",
    description:
      "Book a guided walkthrough, ask about enterprise deployment or request a tailored demo. We reply from ceo@sajidafridi.com.",
    priority: 0.7,
    changefreq: "yearly",
  },
  {
    path: "/demo",
    title: "Live Demo — JW Corporation × Enviro Pakistan | RevFlow",
    description:
      "Switch four personas and run warranty dispatch, dealer credit checks, cross-vertical bundling and ERP sync against seeded Pakistani data.",
    priority: 0.9,
    changefreq: "weekly",
    spa: true,
  },
  {
    path: "/privacy",
    title: "Privacy Policy | RevFlow",
    description:
      "How RevFlow collects, uses and retains data, including the 14-day retention policy for demo accounts.",
    priority: 0.3,
    changefreq: "yearly",
  },
  {
    path: "/terms",
    title: "Terms of Use | RevFlow",
    description:
      "Terms governing use of the RevFlow website, demo environment and evaluation workspaces.",
    priority: 0.3,
    changefreq: "yearly",
  },
];

export const NAV_LINKS = [
  { label: "Platform", href: "/platform" },
  { label: "Solutions", href: "/solutions" },
  { label: "Integrations", href: "/integrations" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
];

export const SOLUTION_PAGES = [
  {
    slug: "enviro-pakistan",
    path: "/solutions/enviro-pakistan",
    name: "Enviro Pakistan",
    kind: "B2C appliances",
    blurb:
      "Warranty registry, dealer secondary sales and technician dispatch for a national appliance brand.",
  },
  {
    slug: "jw-sez",
    path: "/solutions/jw-sez",
    name: "JW-SEZ",
    kind: "Industrial zone",
    blurb:
      "Land and warehouse pipeline with cross-vertical bundling across the group portfolio.",
  },
  {
    slug: "jw-forland",
    path: "/solutions/jw-forland",
    name: "JW Forland",
    kind: "Commercial vehicles",
    blurb:
      "Fleet deal desk, institutional tenders and after-sales service for vehicle distribution.",
  },
  {
    slug: "rd-distribution",
    path: "/solutions/rd-distribution",
    name: "RD Pvt Ltd",
    kind: "Regional distribution",
    blurb:
      "Primary and secondary sales with live credit limits across 150+ distribution branches.",
  },
] as const;

export function routeMeta(path: string): RouteMeta {
  return (
    ROUTES.find((r) => r.path === path) || {
      path,
      title: "Page not found | RevFlow",
      description: "The page you are looking for does not exist.",
      priority: 0,
      changefreq: "yearly",
      noindex: true,
    }
  );
}

export function absoluteUrl(path: string) {
  return `${SITE.url}${path === "/" ? "/" : path.replace(/\/$/, "")}`;
}
