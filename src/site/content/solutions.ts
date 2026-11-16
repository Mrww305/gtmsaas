import {
  Boxes,
  Building2,
  ClipboardCheck,
  CreditCard,
  FileSignature,
  Gauge,
  HardDrive,
  Landmark,
  MapPin,
  MessageCircle,
  Package,
  Percent,
  Route,
  ShieldCheck,
  Sparkles,
  Store,
  Target,
  Truck,
  Users,
  Warehouse,
  Wrench,
} from "lucide-react";
import type { ComponentType } from "react";

export type Solution = {
  slug: string;
  name: string;
  kind: string;
  eyebrow: string;
  title: string;
  intro: string;
  stats: { value: string; label: string }[];
  challenges: { title: string; body: string }[];
  capabilities: { icon: ComponentType<{ className?: string }>; title: string; body: string }[];
  steps: { title: string; body: string }[];
  faq: { q: string; a: string }[];
  related: string[];
};

export const SOLUTIONS: Solution[] = [
  {
    slug: "enviro-pakistan",
    name: "Enviro Pakistan",
    kind: "B2C appliances",
    eyebrow: "Solutions · B2C appliances",
    title: "Sell appliances, honour warranties and dispatch technicians from one system",
    intro:
      "Appliance brands run two businesses at once: high-velocity retail through hundreds of dealers, and a field service network that installs and repairs every unit sold. RevFlow keeps the serial registry, dealer credit and dispatch queue in a single workspace, so a WhatsApp complaint can become a signed-off job without a spreadsheet in between.",
    stats: [
      { value: "150+", label: "dealer branches" },
      { value: "60 mo", label: "warranty registry" },
      { value: "4 h", label: "cooling SLA" },
      { value: "4", label: "personas" },
    ],
    challenges: [
      {
        title: "Warranty claims arrive as chat messages",
        body: "A customer messages a photo of an AC remote. Nobody knows the serial number, purchase date or whether the unit is still covered, so the agent asks for information the business already has.",
      },
      {
        title: "Credit limits live in spreadsheets",
        body: "Dealer balances are reconciled monthly. By the time finance flags an over-limit account, the truck has already left the warehouse.",
      },
      {
        title: "Dispatch runs on phone calls",
        body: "Technicians are assigned by calling whoever is closest. SLA clocks, parts used and customer sign-off stay on paper.",
      },
      {
        title: "Secondary sales are invisible",
        body: "Head office sees shipments to distributors, not what dealers actually sold. Seasonal promotions cannot be measured at the point of sale.",
      },
    ],
    capabilities: [
      {
        icon: HardDrive,
        title: "Serial and warranty registry",
        body: "Every unit is an asset with a serial number, owner, dealer, purchase date and warranty status, searchable from the customer's phone number.",
      },
      {
        icon: MessageCircle,
        title: "WhatsApp intake",
        body: "An inbound message is matched to a contact and asset, the warranty is verified, and a ticket is created with the right SLA and issue type.",
      },
      {
        icon: MapPin,
        title: "Map-based dispatch",
        body: "Available technicians are filtered by city, assigned to the ticket, and their status flips to on-job until the work is closed.",
      },
      {
        icon: CreditCard,
        title: "Dealer credit guard",
        body: "Orders are priced, discounted and checked against live credit exposure before they are accepted. Over-limit orders are blocked with the exact shortfall.",
      },
      {
        icon: Percent,
        title: "Seasonal trade promotions",
        body: "Volume thresholds apply a promotion automatically, and the discount is stored on the order so finance can reconcile it later.",
      },
      {
        icon: FileSignature,
        title: "Digital sign-off",
        body: "The technician captures parts used, notes and a customer signature on mobile. The ticket closes with an auditable record.",
      },
    ],
    steps: [
      {
        title: "Capture the complaint",
        body: "The customer's WhatsApp number is matched to a contact, and the registered asset is pulled with its warranty status.",
      },
      {
        title: "Verify and ticket",
        body: "Warranty validity, issue type and SLA are applied. The ticket is created with the channel recorded as WhatsApp.",
      },
      {
        title: "Dispatch the technician",
        body: "A technician in the customer's city is assigned from the dispatch board and the SLA clock starts.",
      },
      {
        title: "Resolve with signature",
        body: "The field app records parts, notes and the customer signature, then closes the ticket and frees the technician.",
      },
    ],
    faq: [
      {
        q: "Does this replace our ERP?",
        a: "No. RevFlow owns the revenue and service workflow, then syncs invoices, inventory reservations and customer masters to SAP, NetSuite or Dynamics 365. The ERP remains the book of record for accounting.",
      },
      {
        q: "Can a dealer see only their own orders and credit?",
        a: "Yes. The dealer portal is scoped to the account, so a retail dealer sees their own orders, balance and available credit, not the whole network.",
      },
      {
        q: "What happens when the warranty has expired?",
        a: "The ticket is still created, but it is flagged as out-of-warranty so the agent can quote a chargeable repair before dispatching.",
      },
    ],
    related: ["rd-distribution", "jw-sez"],
  },
  {
    slug: "jw-sez",
    name: "JW-SEZ",
    kind: "Industrial zone",
    eyebrow: "Solutions · Industrial zones",
    title: "Fill the industrial zone, then sell the tenant everything they need next",
    intro:
      "Selling land or warehouse space is only the first transaction. The tenant also needs cooling, logistics and fit-out, often from a different company inside the same group. RevFlow tracks the institutional pipeline at holding level and turns one signed plot into a multi-entity bundle.",
    stats: [
      { value: "PKR 389M", label: "open pipeline" },
      { value: "3", label: "group entities" },
      { value: "87%", label: "bundle confidence" },
      { value: "1", label: "account view" },
    ],
    challenges: [
      {
        title: "Long institutional cycles",
        body: "A plot sale can take nine months and involve legal, procurement and finance. Stage changes are tracked in decks and email threads.",
      },
      {
        title: "Each entity sells in isolation",
        body: "The zone team sells land, Forland sells trucks and Enviro sells ACs. Nobody owns the combined quote.",
      },
      {
        title: "Holding leadership sees lagging numbers",
        body: "Cross-entity revenue is assembled quarterly from spreadsheets, long after the deal was won or lost.",
      },
      {
        title: "Cross-sell depends on memory",
        body: "Whether a buyer is offered cooling and fleet depends on which salesperson happens to remember.",
      },
    ],
    capabilities: [
      {
        icon: Target,
        title: "Institutional pipeline",
        body: "Opportunities with stage, expected close date, deal value and account hierarchy, shared across the group.",
      },
      {
        icon: Sparkles,
        title: "Cross-vertical bundling",
        body: "A rule-based recommendation proposes adjacent products for the account: warehouse space, cooling and commercial vehicles.",
      },
      {
        icon: Landmark,
        title: "Holding-level rollups",
        body: "Revenue, pipeline and credit exposure roll up by entity so leadership sees the conglomerate, not four separate reports.",
      },
      {
        icon: Building2,
        title: "Account hierarchy",
        body: "Corporate clients, industrial tenants and their procurement contacts sit under one account with a single owner.",
      },
      {
        icon: ClipboardCheck,
        title: "Quote-ready bundles",
        body: "Recommended lines carry quantities, unit prices and the rationale, so a combined quote can be issued without re-keying.",
      },
      {
        icon: Gauge,
        title: "Pipeline hygiene",
        body: "Stalled stages, missing close dates and unassigned owners surface on the executive overview before they cost a quarter.",
      },
    ],
    steps: [
      {
        title: "Open the opportunity",
        body: "A plot or warehouse deal is created against the tenant account with value and expected close date.",
      },
      {
        title: "Request a bundle",
        body: "RevFlow reads the vertical, account type and city, then proposes the adjacent products with a confidence score.",
      },
      {
        title: "Review the combined quote",
        body: "Original deal value, bundle value and the combined total are shown side by side for the account owner.",
      },
      {
        title: "Flag and hand off",
        body: "The cross-sell flag is saved on the opportunity so the other entities can pick up their line items.",
      },
    ],
    faq: [
      {
        q: "Is the bundle recommendation a black box?",
        a: "No. It is a transparent rules engine keyed on vertical, account type and city, and every suggested line carries a written reason. The demo shows the same output you would review before quoting.",
      },
      {
        q: "Can different entities see each other's pipeline?",
        a: "That is a permission decision. Holding-level roles see the consolidated view, while entity teams can be limited to their own accounts and opportunities.",
      },
      {
        q: "Does it handle multi-year leases?",
        a: "Opportunity value and close date are explicit fields, so a lease can be modelled as annual contract value or total contract value depending on how your finance team reports.",
      },
    ],
    related: ["jw-forland", "enviro-pakistan"],
  },
  {
    slug: "jw-forland",
    name: "JW Forland",
    kind: "Commercial vehicles",
    eyebrow: "Solutions · Commercial vehicles",
    title: "A deal desk built for fleet tenders and after-sales service",
    intro:
      "Commercial vehicle sales are tender-driven and fleet-sized: one deal can be twenty trucks, financed over years, with service obligations attached. RevFlow models the fleet deal, the unit-level asset registry and the workshop tickets in the same system as the rest of the group.",
    stats: [
      { value: "PKR 178M", label: "closed-won fleet" },
      { value: "20", label: "units per deal" },
      { value: "36 mo", label: "vehicle warranty" },
      { value: "3", label: "ERP connectors" },
    ],
    challenges: [
      {
        title: "Tenders move through many hands",
        body: "Procurement, finance and legal each hold part of the deal. Stage and next action are rarely in one place.",
      },
      {
        title: "Fleet deals need unit-level records",
        body: "A twenty-truck order becomes twenty assets with individual service histories, not one line item.",
      },
      {
        title: "After-sales is a separate silo",
        body: "The sales team closes the deal and the workshop starts from scratch, with no view of the fleet or its warranty.",
      },
      {
        title: "Inventory commitments are manual",
        body: "Reserving stock against a signed order is a phone call to the plant, not a system transaction.",
      },
    ],
    capabilities: [
      {
        icon: Truck,
        title: "Fleet deal desk",
        body: "Opportunities sized in units and PKR, with stage gates that mirror a tender process rather than a consumer funnel.",
      },
      {
        icon: HardDrive,
        title: "Unit-level assets",
        body: "Each chassis or vehicle becomes an asset with its own serial, owner, warranty and service history.",
      },
      {
        icon: Wrench,
        title: "Workshop tickets",
        body: "Service tickets link back to the asset and the account, so warranty work is visible to both sales and service.",
      },
      {
        icon: Package,
        title: "Inventory reservation",
        body: "Order commitments reserve stock at the warehouse and sync the reservation to the ERP connector.",
      },
      {
        icon: CreditCard,
        title: "Credit and financing",
        body: "Fleet orders are checked against the account's credit limit, with paid, credit and BNPL payment modes.",
      },
      {
        icon: ShieldCheck,
        title: "Warranty governance",
        body: "Warranty months are defined per product, and claims are validated against the asset rather than a spreadsheet.",
      },
    ],
    steps: [
      {
        title: "Qualify the fleet deal",
        body: "Units, value and expected close date are captured against the corporate account.",
      },
      {
        title: "Confirm stock and credit",
        body: "Availability is reserved and the order is validated against the account's remaining credit.",
      },
      {
        title: "Register the units",
        body: "Delivered vehicles become individual assets with serial numbers and warranty expiry dates.",
      },
      {
        title: "Service the fleet",
        body: "Workshop tickets attach to the asset, and the whole history stays with the account.",
      },
    ],
    faq: [
      {
        q: "Can one order create many assets?",
        a: "Yes. The asset registry is keyed per serial number, so a fleet order can produce one asset record per vehicle while the commercial order stays a single line.",
      },
      {
        q: "Do you support multi-currency?",
        a: "The demo is seeded in PKR. Currency is a field on the order and ERP payload, so other currencies can be configured per entity.",
      },
      {
        q: "How does the ERP stay in sync?",
        a: "Invoice, inventory reservation, customer master and GL postings are pushed as discrete events with a reference and status, visible in the payload log.",
      },
    ],
    related: ["jw-sez", "enviro-pakistan"],
  },
  {
    slug: "rd-distribution",
    name: "RD Pvt Ltd",
    kind: "Regional distribution",
    eyebrow: "Solutions · Regional distribution",
    title: "Give every branch the same live view of credit, stock and promotions",
    intro:
      "Distribution is a working-capital business. The difference between a good quarter and a bad one is how quickly a branch can approve a credit order, apply the right promotion and see what dealers actually sold. RevFlow puts primary and secondary sales in one ledger.",
    stats: [
      { value: "150+", label: "branches" },
      { value: "7.5%", label: "seasonal promo" },
      { value: "3", label: "payment modes" },
      { value: "PKR 18M", label: "credit limits" },
    ],
    challenges: [
      {
        title: "Primary and secondary sales are separate",
        body: "Shipments to distributors and sales from dealers live in different systems, so sell-through is estimated rather than measured.",
      },
      {
        title: "Credit decisions are slow",
        body: "A branch manager cannot see the dealer's live balance, so approvals wait for head office.",
      },
      {
        title: "Promotions are applied inconsistently",
        body: "Seasonal discounts depend on the person entering the order, which makes margin analysis unreliable.",
      },
      {
        title: "Branch performance is a monthly pack",
        body: "Regional managers compare branches from a spreadsheet that is already three weeks old.",
      },
    ],
    capabilities: [
      {
        icon: Store,
        title: "Dealer directory",
        body: "Retail dealers and regional distributors with city, region, tier, credit limit and current balance.",
      },
      {
        icon: Boxes,
        title: "Primary and secondary orders",
        body: "Order type is explicit, so distributor replenishment and dealer sell-in are reported separately.",
      },
      {
        icon: CreditCard,
        title: "Live credit control",
        body: "Available credit is calculated at the moment of ordering, with a hard block and the exact shortfall when exceeded.",
      },
      {
        icon: Percent,
        title: "Promotion engine",
        body: "Threshold-based discounts apply automatically and are stored per order for reconciliation.",
      },
      {
        icon: Gauge,
        title: "Branch performance",
        body: "Order value, credit utilisation and payment status by branch, refreshed as orders are placed.",
      },
      {
        icon: Users,
        title: "Field rep visits",
        body: "Sales reps log dealer visits from mobile, so coverage is measurable alongside revenue.",
      },
    ],
    steps: [
      {
        title: "Select the dealer",
        body: "The branch manager picks a dealer and immediately sees credit utilisation and available headroom.",
      },
      {
        title: "Build the order",
        body: "Lines are priced from the catalog, with the seasonal promotion applied at the threshold.",
      },
      {
        title: "Pass the credit check",
        body: "Credit orders are validated against live exposure. Paid and BNPL orders follow their own rules.",
      },
      {
        title: "Dispatch and reconcile",
        body: "The order is created as dispatched, the balance is updated, and the event is logged for audit.",
      },
    ],
    faq: [
      {
        q: "Can dealers place their own orders?",
        a: "Yes. The dealer portal is scoped to the dealer account, so a dealer sees their own credit position and order history and can submit a reorder without calling the branch.",
      },
      {
        q: "What happens when an order exceeds the credit limit?",
        a: "The order is rejected with the available amount and the shortfall, and the user can reduce quantity or switch to paid or BNPL.",
      },
      {
        q: "Is the promotion configurable?",
        a: "The demo uses a 7.5% threshold promotion above PKR 1,000,000. Thresholds and rates are configuration, not code.",
      },
    ],
    related: ["enviro-pakistan", "jw-forland"],
  },
];

export function solutionBySlug(slug: string) {
  return SOLUTIONS.find((s) => s.slug === slug);
}
