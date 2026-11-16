import { Link } from "react-router-dom";
import { ArrowRight, Check, Minus } from "lucide-react";
import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { CTABand, Faq, PageHero, Section, SectionHeading } from "../components/Sections";

const tiers = [
  {
    name: "Starter",
    price: "$249",
    period: "/month",
    description: "For a single entity getting its first revenue workflow into production.",
    cta: "Start 12-day free trial",
    features: [
      "Up to 5 seats",
      "10,000 records enriched per month",
      "3 active workflows",
      "Email and WhatsApp channels",
      "Basic scoring and routing",
      "Usage metering dashboard",
      "Dry-run mode",
      "Community support",
    ],
    missing: ["ERP connectors", "Cross-entity rollups", "SSO and SCIM"],
  },
  {
    name: "Growth",
    price: "$749",
    period: "/month",
    description: "For groups running channel distribution and field service together.",
    cta: "Start 12-day free trial",
    popular: true,
    features: [
      "Up to 25 seats",
      "100,000 records enriched per month",
      "Unlimited workflows",
      "All channels plus ads",
      "Advanced assistive agents",
      "Cost attribution per workflow",
      "SAP, NetSuite and Dynamics connectors",
      "Audit log and versioning",
      "Priority support with a CSM",
    ],
    missing: ["Dedicated infrastructure", "Custom retention terms"],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For conglomerates with multi-entity compliance and data-residency needs.",
    cta: "Talk to sales",
    features: [
      "Unlimited seats",
      "Negotiated record volume",
      "Unlimited workflows and entities",
      "Private deployment or VPC peering",
      "SSO, SCIM and custom roles",
      "Custom data residency and retention",
      "Named solutions architect",
      "99.9% uptime commitment",
    ],
    missing: [],
  },
];

const faq = [
  {
    q: "Is the 12-day trial really free?",
    a: "Yes. No credit card is required to start, and the trial workspace is fully functional. At the end you can export your data or move to a paid plan.",
  },
  {
    q: "What counts as an enriched record?",
    a: "Any account, contact or asset record that RevFlow normalises, deduplicates or augments. Raw writes from your own systems are not counted twice.",
  },
  {
    q: "How does the live demo differ from a trial?",
    a: "The public demo runs against a seeded Pakistani dataset shared across visitors, with daily action quotas and a 14-day retention window. A trial workspace is private and starts empty.",
  },
  {
    q: "Can we buy only field service?",
    a: "Field service is part of the platform, not a separate SKU. Starter includes tickets and dispatch; Growth adds ERP sync and multi-entity reporting.",
  },
  {
    q: "Do you charge per entity?",
    a: "No. Seats and record volume are the metered dimensions. Entities, catalogs and warehouses are configuration.",
  },
];

export default function Pricing() {
  return (
    <SiteLayout>
      <Seo
        path="/pricing"
        crumbs={[{ name: "Pricing", path: "/pricing" }]}
        extra={[
          {
            "@type": "Product",
            name: "RevFlow",
            description:
              "Revenue operations platform for multi-entity groups with GTM canvas, channel DMS, field service and ERP sync.",
            brand: { "@type": "Brand", name: "RevFlow" },
            offers: [
              {
                "@type": "Offer",
                name: "Starter",
                price: "249",
                priceCurrency: "USD",
                url: "https://gtmsaas.sajidafridi.com/pricing",
                availability: "https://schema.org/InStock",
              },
              {
                "@type": "Offer",
                name: "Growth",
                price: "749",
                priceCurrency: "USD",
                url: "https://gtmsaas.sajidafridi.com/pricing",
                availability: "https://schema.org/InStock",
              },
            ],
          },
          {
            "@type": "FAQPage",
            mainEntity: faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
      <PageHero
        eyebrow="Pricing"
        title="Priced on seats and volume, not on how many entities you own"
        intro="Start with a 12-day free trial, no credit card. Plans are metered on seats and enriched records, so adding a business unit or a warehouse does not trigger a renegotiation."
        primary={{ label: "Start free trial", href: "/demo/signup" }}
        secondary={{ label: "Compare in the live demo", href: "/demo" }}
        crumbs={[{ name: "Pricing", path: "/pricing" }]}
      />

      <Section>
        <div className="grid gap-4 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-3xl border p-6 ${
                tier.popular
                  ? "border-violet-500/40 bg-gradient-to-b from-violet-600/10 to-slate-900/40"
                  : "border-white/5 bg-slate-900/40"
              }`}
            >
              {tier.popular ? (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  Most popular
                </span>
              ) : null}
              <h2 className="text-lg font-semibold text-white">{tier.name}</h2>
              <p className="mt-2 min-h-[40px] text-sm leading-relaxed text-slate-400">{tier.description}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-white">{tier.price}</span>
                <span className="text-sm text-slate-500">{tier.period}</span>
              </div>
              <Link
                to={tier.name === "Enterprise" ? "/contact" : "/demo/signup"}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                  tier.popular
                    ? "bg-gradient-to-r from-violet-600 to-cyan-500 text-white hover:opacity-90"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {tier.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <ul className="mt-6 space-y-2.5 border-t border-white/5 pt-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    {f}
                  </li>
                ))}
                {tier.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-500">
                    <Minus className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Prices in USD, billed monthly. Annual billing and PKR invoicing are available on request. Usage above plan
          limits is metered, never silently throttled.
        </p>
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="What every plan includes"
          title="The parts that are not negotiable"
          intro="Security, audit and retention basics are in every tier, including the public demo."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Role-based access", body: "Four built-in personas plus custom roles on Enterprise." },
            { title: "Append-only audit", body: "Every action recorded with actor, timestamp and payload reference." },
            { title: "Usage quotas", body: "Daily action limits protect shared workspaces from exhaustion." },
            { title: "Data retention", body: "14-day retention on demo data, configurable on Enterprise." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/5 bg-slate-950/50 p-5">
              <h3 className="text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title="Pricing questions, answered" />
        <Faq items={faq} />
      </Section>

      <CTABand
        title="Try it before you talk to anyone"
        body="Create a demo account, run the four flows, then decide whether a paid trial is worth your time."
      />
    </SiteLayout>
  );
}
