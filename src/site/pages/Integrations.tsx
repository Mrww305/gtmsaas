import SiteLayout from "../layout/SiteLayout";
import { Seo } from "../seo/Seo";
import { CTABand, Cards, PageHero, Section, SectionHeading, Stats, Steps } from "../components/Sections";
import { Braces, Database, MessageCircle, Plug, RefreshCw, ShieldCheck, Truck, Webhook } from "lucide-react";

const connectors = [
  {
    icon: Database,
    title: "SAP S/4HANA",
    body: "Customer master, invoice and GL posting sync via OData services. Each event carries a reference, timestamp and status.",
    points: ["Customer master outbound", "Invoice and credit memo", "Inventory reservation", "Idempotent event keys"],
  },
  {
    icon: Plug,
    title: "Oracle NetSuite",
    body: "SuiteTalk REST integration for sales orders, fulfilment and item masters, with entity-level account mapping.",
    points: ["Sales order push", "Item and price list", "Fulfilment status", "Multi-subsidiary mapping"],
  },
  {
    icon: RefreshCw,
    title: "Microsoft Dynamics 365",
    body: "Dataverse webhooks for accounts, opportunities and service cases, keeping the CRM and ERP aligned.",
    points: ["Account and contact", "Opportunity stages", "Service case linkage", "OAuth client credentials"],
  },
  {
    icon: MessageCircle,
    title: "WhatsApp Business",
    body: "Inbound warranty messages are matched to a contact and asset before a ticket is created with the right SLA.",
    points: ["Template messages", "Media attachments", "Phone-to-contact match", "Channel attribution"],
  },
  {
    icon: Truck,
    title: "Map and dispatch",
    body: "Technician availability by city drives assignment, with distance and workload taken into account.",
    points: ["City coverage", "Workload balance", "SLA countdown", "Status transitions"],
  },
  {
    icon: Webhook,
    title: "Outbound webhooks",
    body: "Every domain event can be forwarded to your own middleware with a signed payload and retry policy.",
    points: ["Signed payloads", "Retry with backoff", "Dead-letter queue", "Event replay"],
  },
];

export default function Integrations() {
  return (
    <SiteLayout>
      <Seo path="/integrations" crumbs={[{ name: "Integrations", path: "/integrations" }]} />
      <PageHero
        eyebrow="Integrations"
        title="Your ERP stays the book of record. RevFlow owns the workflow."
        intro="RevFlow is deliberately not an accounting system. It captures the revenue and service events your ERP needs, then hands them over as clean, inspectable payloads. You can see exactly what would be sent before you commit."
        primary={{ label: "Inspect payloads in the demo", href: "/demo" }}
        secondary={{ label: "Read the platform overview", href: "/platform" }}
        crumbs={[{ name: "Integrations", path: "/integrations" }]}
        aside={
          <Stats
            items={[
              { value: "3", label: "ERP connectors" },
              { value: "6", label: "event types" },
              { value: "JSON", label: "payload format" },
              { value: "2-way", label: "sync direction" },
            ]}
          />
        }
      />

      <Section>
        <SectionHeading
          eyebrow="Connectors"
          title="The systems a multi-entity group already runs"
          intro="Connectors are configuration on top of the same event model, which means adding an entity does not mean adding an integration project."
        />
        <Cards items={connectors} columns={3} />
      </Section>

      <Section tone="panel">
        <SectionHeading
          eyebrow="How sync works"
          title="Event-driven, inspectable and reversible"
          intro="Every write produces a discrete event with a reference and a status. Nothing is a silent background job you cannot audit."
        />
        <Steps
          items={[
            { title: "Domain event", body: "An order is placed, a ticket closes or a customer master changes." },
            { title: "Payload build", body: "The event is mapped to the target ERP schema with entity and currency context." },
            { title: "Toggle and send", body: "The sync switch is per connector and can be paused without losing events." },
            { title: "Log and replay", body: "Each payload is stored with status and reference, so failures can be retried." },
          ]}
        />
      </Section>

      <Section>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Braces className="h-4 w-4 text-violet-300" /> Example payload
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-white/5 bg-slate-950/80 p-4 text-[11px] leading-relaxed text-slate-300">
{`{
  "event": "order.created",
  "reference": "CO-2026-004182",
  "entity": "Enviro Pakistan",
  "target": "sap_s4hana",
  "occurred_at": "2026-11-16T09:41:22Z",
  "payload": {
    "customer_id": "ACC-1042",
    "currency": "PKR",
    "lines": [
      { "sku": "ENV-AC-18K", "qty": 4, "unit_price": 185000 }
    ],
    "discount": 55500,
    "total": 684500,
    "payment_status": "credit"
  },
  "status": "queued"
}`}
            </pre>
          </div>
          <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-violet-300" /> What we do not do
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-400">
              <li>
                <span className="font-semibold text-white">We do not replace your GL.</span> RevFlow posts revenue
                events; statutory accounting stays in the ERP.
              </li>
              <li>
                <span className="font-semibold text-white">We do not silently drop failures.</span> Every payload keeps
                a status and a reference, so a rejected invoice is visible, not lost.
              </li>
              <li>
                <span className="font-semibold text-white">We do not require a middleware project.</span> The demo ships
                with a sync toggle and payload log so integration scope is understood before signing.
              </li>
            </ul>
          </div>
        </div>
      </Section>

      <CTABand
        title="See the sync log before you see a contract"
        body="Toggle SAP, NetSuite or Dynamics in the demo and inspect the JSON payload RevFlow would send for the order you just placed."
      />
    </SiteLayout>
  );
}

