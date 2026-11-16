import {
  Boxes,
  Brain,
  Building2,
  ClipboardList,
  Database,
  FileSignature,
  Gauge,
  HardDrive,
  Headphones,
  Layers,
  MapPin,
  Plug,
  ShieldCheck,
  Smartphone,
  Store,
  Target,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";
import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { Cards, CTABand, PageHero, Section, SectionHeading, Stats, Steps } from "../components/Sections";

const capabilities = [
  {
    icon: Database,
    title: "Revenue data graph",
    body: "Accounts, contacts, products, assets, opportunities, orders and tickets are one connected model, not seven tools with an integration tax.",
  },
  {
    icon: Workflow,
    title: "Visual GTM canvas",
    body: "Describe a workflow once and run it across entities. No GTM engineer, no prompt engineering, no glue code.",
  },
  {
    icon: Store,
    title: "Channel DMS",
    body: "Primary and secondary sales, dealer credit limits, tiers and seasonal promotions, with a portal scoped to each dealer.",
  },
  {
    icon: Wrench,
    title: "Field service dispatch",
    body: "Warranty validation, SLA clocks, technician assignment by city and mobile sign-off on the customer's doorstep.",
  },
  {
    icon: Brain,
    title: "Assistive intelligence",
    body: "Rule-based and model-assisted suggestions for cross-sell bundles, next-best accounts and dispatch routing, each with a written rationale.",
  },
  {
    icon: ShieldCheck,
    title: "Governance and audit",
    body: "Role-based visibility, an append-only activity log and daily action quotas for shared demo workspaces.",
  },
];

const entities = [
  ["Entity_Vertical", "The group structure: B2C brand, industrial zone, fleet business, distribution arm."],
  ["Account", "Retail dealers, regional distributors, corporate clients and industrial tenants with credit and tier."],
  ["Contact", "End consumers, dealer owners and procurement heads, including WhatsApp numbers."],
  ["Product_Catalog", "Appliance SKUs, commercial vehicles and industrial land, priced per entity with warranty terms."],
  ["Customer_Asset", "Serial numbers and warranty dates for every unit sold, linked to its owner and dealer."],
  ["B2B_Opportunity", "Institutional pipeline with stage, value, close date and cross-sell flag."],
  ["Channel_Order", "Primary and secondary sales with payment status, promotion discount and dispatch state."],
  ["Service_Ticket", "WhatsApp, call centre and web tickets linked to an asset, technician and SLA."],
];

const personas = [
  {
    icon: Building2,
    title: "Group executive",
    body: "Cross-entity revenue, institutional pipeline and credit exposure in one holding-level view.",
  },
  {
    icon: Boxes,
    title: "Sales and channel manager",
    body: "Secondary sales across branches, dealer credit limits and seasonal appliance targets.",
  },
  {
    icon: Headphones,
    title: "Service dispatcher",
    body: "Inbound warranty tickets, serial validation, SLA clocks and technician assignment.",
  },
  {
    icon: Smartphone,
    title: "Field technician or rep",
    body: "A responsive mobile workspace for jobs, dealer visits and customer signatures.",
  },
];

export default function Platform() {
  return (
    <SiteLayout>
      <Seo path="/platform" crumbs={[{ name: "Platform", path: "/platform" }]} />
      <PageHero
        eyebrow="Platform"
        title="One canvas for revenue, channels and field service"
        intro="RevFlow connects the eight records a multi-entity group actually runs on, then gives each role a workspace built for their day. The result is a single source of truth from first contact to signed service ticket."
        primary={{ label: "Open the live demo", href: "/demo" }}
        secondary={{ label: "See the data model", href: "/solutions" }}
        aside={
          <Stats
            items={[
              { value: "8", label: "core entities" },
              { value: "4", label: "personas" },
              { value: "4", label: "end-to-end flows" },
              { value: "3", label: "ERP connectors" },
            ]}
          />
        }
      />

      <Section>
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything a revenue team touches, in one place"
          intro="Each capability is a working part of the demo, not a screenshot. Every action writes to the database and updates the dashboards."
        />
        <Cards items={capabilities} columns={3} />
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="Data model"
          title="Eight entities, deliberately few"
          intro="Most revenue stacks fail at the seams between systems. RevFlow keeps the model small enough to understand and connected enough to answer real questions."
        />
        <div className="mt-10 overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Entity</th>
                <th className="px-5 py-3 font-semibold">What it holds</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entities.map(([name, body]) => (
                <tr key={name} className="bg-slate-950/40">
                  <td className="whitespace-nowrap px-5 py-3.5 font-mono text-xs font-semibold text-violet-300">
                    {name}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{body}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHeading
          eyebrow="Role-based access"
          title="Four personas, one source of truth"
          intro="Switch personas live during a presentation. Navigation, KPIs and available actions change with the role."
        />
        <Cards items={personas} columns={4} />
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="From signup to insight"
          title="A demo workspace in four steps"
          intro="The same gates apply to every visitor, so shared demo environments stay usable."
        />
        <Steps
          items={[
            { title: "Create an account", body: "Name, work email and a password. Terms are accepted explicitly." },
            { title: "Verify the email", body: "A six-digit code confirms the address before any data is exposed." },
            { title: "Complete onboarding", body: "Company, role and use case personalise the workspace and the KPIs." },
            { title: "Run the flows", body: "Daily quotas apply, and every action is written to the audit log." },
          ]}
        />
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Plug className="h-4 w-4 text-violet-300" /> Built to integrate
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              SAP S/4HANA, Oracle NetSuite and Microsoft Dynamics 365 connectors exchange invoices, inventory
              reservations, customer masters and GL postings. WhatsApp Business API carries warranty intake, and
              map-based dispatch routes technicians by city.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["SAP S/4HANA", "Oracle NetSuite", "Dynamics 365", "WhatsApp Business", "SMTP"].map((t) => (
                <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Layers className="h-4 w-4 text-violet-300" /> Multi-tenant by design
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Each entity keeps its own catalog, pricing and warranty terms while sharing the account and contact
              graph. Holding-level roles see the consolidated picture; entity teams stay scoped to their own book.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
              {[
                { icon: Building2, label: "Enviro Pakistan" },
                { icon: Target, label: "JW-SEZ" },
                { icon: Boxes, label: "JW Forland" },
                { icon: Users, label: "RD Pvt Ltd" },
              ].map((e) => (
                <span key={e.label} className="inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5">
                  <e.icon className="h-3.5 w-3.5 text-violet-300" /> {e.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="Also included"
          title="The details that make a demo credible"
          intro="Small pieces of product discipline that buyers check before they believe a workflow."
        />
        <Cards
          columns={3}
          items={[
            {
              icon: Gauge,
              title: "Usage metering",
              body: "Daily action quotas per user, visible in the workspace, so a public demo cannot be exhausted by one visitor.",
            },
            {
              icon: ClipboardList,
              title: "Audit trail",
              body: "Every ticket, order, bundle and sync is recorded with the actor and timestamp.",
            },
            {
              icon: HardDrive,
              title: "Retention policy",
              body: "Demo accounts and their records are purged after 14 days, on a schedule, not by hand.",
            },
            {
              icon: MapPin,
              title: "Coverage view",
              body: "Technician availability by city, so dispatchers assign work to the nearest free engineer.",
            },
            {
              icon: FileSignature,
              title: "Proof of service",
              body: "Customer signatures are captured on mobile and stored with the ticket as an image.",
            },
            {
              icon: Target,
              title: "Cross-sell flags",
              body: "Bundle recommendations persist on the opportunity, so the hand-off between entities is explicit.",
            },
          ]}
        />
      </Section>

      <CTABand />
    </SiteLayout>
  );
}
