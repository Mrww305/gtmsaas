import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { CTABand, Cards, PageHero, Prose, Section, SectionHeading, Stats } from "../components/Sections";
import { Building2, Compass, Layers, Rocket, ShieldCheck, Users } from "lucide-react";
import { SITE } from "../seo/routes";

export default function About() {
  return (
    <SiteLayout>
      <Seo
        path="/about"
        crumbs={[{ name: "About", path: "/about" }]}
        extra={[
          {
            "@type": "AboutPage",
            name: "About RevFlow",
            description:
              "RevFlow is a revenue operations platform built in partnership with Megnitoo.com, focused on multi-entity go-to-market execution.",
            mainEntity: { "@id": `${SITE.url}/#organization` },
          },
        ]}
      />
      <PageHero
        eyebrow="About"
        title="Built for the way Pakistani conglomerates actually sell"
        intro="RevFlow started with a simple observation: the groups we work with do not have a lead-generation problem, they have an execution problem across entities. An appliance brand, an industrial zone, a fleet business and a distribution arm each run their own spreadsheets, and nobody can answer a group-level question without a week of reconciliation."
        primary={{ label: "Open the live demo", href: "/demo" }}
        secondary={{ label: "Talk to the founder", href: "/contact" }}
        crumbs={[{ name: "About", path: "/about" }]}
        aside={
          <Stats
            items={[
              { value: "2026", label: "founded" },
              { value: "4", label: "entities modelled" },
              { value: "8", label: "core records" },
              { value: "1", label: "revenue model" },
            ]}
          />
        }
      />

      <Section>
        <Prose>
          <h2>The thesis</h2>
          <p>
            Most CRM and ERP projects fail at the boundary between them. Sales closes a deal in one system, service
            opens a ticket in another, finance reconciles in a third, and the dealer portal is a spreadsheet emailed on
            the first of the month. Every hand-off loses context, and the group pays for that loss in margin, SLA
            breaches and duplicated work.
          </p>
          <p>
            RevFlow takes the opposite position. Keep the model deliberately small — eight records that describe any
            revenue business — and make the workflow on top of it configurable per entity. A dealer, a tenant and a
            fleet buyer are all accounts. An air conditioner, a truck and a warehouse plot are all catalog items with a
            price and a warranty term. Once that spine is shared, cross-entity reporting stops being a quarterly
            spreadsheet exercise.
          </p>

          <h2>What we deliberately did not build</h2>
          <ul>
            <li>
              <strong>Not an accounting system.</strong> RevFlow produces clean revenue events and hands them to SAP,
              NetSuite or Dynamics. Statutory books stay where auditors expect them.
            </li>
            <li>
              <strong>Not a generic no-code builder.</strong> The canvas is opinionated about revenue objects. That
              constraint is why the flows work without a solutions engineer.
            </li>
            <li>
              <strong>Not a black-box AI layer.</strong> Assistive suggestions are rule-based first, with a written
              rationale attached to every recommendation, so a sales manager can defend it.
            </li>
          </ul>

          <h2>The demo is the product argument</h2>
          <p>
            Rather than a slide deck, the site ships a working demo seeded with realistic Pakistani data: Lahore,
            Karachi and Islamabad accounts, PKR pricing, appliance SKUs with serial numbers and warranty dates, dealer
            credit limits, and four role-based personas. Visitors can run warranty intake from a WhatsApp message,
            place a dealer order that fails a credit check, request a cross-vertical bundle, and toggle an ERP sync to
            inspect the payload. Nothing is mocked at the UI layer — every action writes to MySQL.
          </p>
          <p>
            Demo accounts are time-boxed and metered on purpose. A shared environment needs quotas and a 14-day
            retention window to stay usable, and those constraints are part of the product, not an afterthought.
          </p>

          <h2>Partnership</h2>
          <p>
            RevFlow is built in partnership with{" "}
            <a href="https://megnitoo.com" target="_blank" rel="noopener noreferrer">
              Megnitoo.com
            </a>
            , which brings the engineering and delivery capacity behind the platform. The commercial model is direct:
            talk to the team, run the demo, then scope a pilot against one entity before expanding across the group.
          </p>
        </Prose>
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="Principles"
          title="How we make product decisions"
          intro="Four rules that have kept the platform small enough to ship and specific enough to be useful."
        />
        <Cards
          columns={2}
          items={[
            {
              icon: Layers,
              title: "Few entities, deep links",
              body: "Adding a ninth record should require deleting one. The value is in the relationships, not the table count.",
            },
            {
              icon: ShieldCheck,
              title: "Auditable by default",
              body: "If an action changes revenue or service state, it is logged with an actor and a reference. No silent writes.",
            },
            {
              icon: Compass,
              title: "Show the payload",
              body: "Integrations are demonstrated, not described. Buyers can inspect exactly what would cross the boundary.",
            },
            {
              icon: Rocket,
              title: "Demo first",
              body: "If a capability cannot be clicked through, it is not ready to be sold. The demo is the specification.",
            },
          ]}
        />
      </Section>

      <Section>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: Users, title: "Founder", body: `${SITE.author}, who leads product and delivery.` },
            { icon: Building2, title: "Engineering partner", body: "Megnitoo.com, handling platform engineering." },
            { icon: Compass, title: "Design partner", body: "JW Corporation, the multi-entity group in the demo." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/5 bg-slate-900/40 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                <item.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </Section>

      <CTABand
        title="Have a multi-entity problem worth solving?"
        body="Tell us which entities you are trying to connect and what breaks today. We reply from ceo@sajidafridi.com."
      />
    </SiteLayout>
  );
}
