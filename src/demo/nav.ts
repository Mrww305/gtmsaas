import {
  Activity,
  Building2,
  Boxes,
  HardDrive,
  LayoutDashboard,
  Package,
  Plug,
  ShoppingCart,
  Smartphone,
  Target,
  Users,
  Wrench,
} from "lucide-react";

export type ModuleId =
  | "overview"
  | "accounts"
  | "contacts"
  | "catalog"
  | "assets"
  | "opportunities"
  | "orders"
  | "tickets"
  | "field"
  | "erp"
  | "activity";

export const MODULES: Record<ModuleId, { label: string; icon: any; section: string; blurb: string }> = {
  overview: { label: "Overview", icon: LayoutDashboard, section: "Workspace", blurb: "Live KPIs" },
  accounts: { label: "Accounts", icon: Building2, section: "Directory", blurb: "B2B & channel" },
  contacts: { label: "Contacts", icon: Users, section: "Directory", blurb: "Consumers & buyers" },
  catalog: { label: "Products", icon: Package, section: "Directory", blurb: "SKUs & pricing" },
  assets: { label: "Assets", icon: HardDrive, section: "Service", blurb: "Serial & warranty" },
  tickets: { label: "Service tickets", icon: Wrench, section: "Service", blurb: "Warranty dispatch" },
  field: { label: "Field mobile", icon: Smartphone, section: "Service", blurb: "Technician view" },
  opportunities: { label: "Opportunities", icon: Target, section: "Revenue", blurb: "B2B pipeline" },
  orders: { label: "Channel orders", icon: ShoppingCart, section: "Revenue", blurb: "Secondary sales" },
  erp: { label: "ERP sync", icon: Plug, section: "Platform", blurb: "SAP · NetSuite" },
  activity: { label: "Activity", icon: Activity, section: "Platform", blurb: "Audit trail" },
};

export type PersonaId = "executive" | "channel" | "dispatcher" | "field";

export const PERSONAS: Record<
  PersonaId,
  { label: string; short: string; sub: string; icon: any; modules: ModuleId[]; defaultModule: ModuleId }
> = {
  executive: {
    label: "JW Group Executive",
    short: "Executive",
    sub: "Holding level",
    icon: Building2,
    modules: ["overview", "opportunities", "accounts", "contacts", "erp", "activity"],
    defaultModule: "overview",
  },
  channel: {
    label: "Enviro Sales & Channel Manager",
    short: "Channel",
    sub: "Secondary sales",
    icon: Boxes,
    modules: ["overview", "orders", "accounts", "contacts", "catalog", "activity"],
    defaultModule: "overview",
  },
  dispatcher: {
    label: "Enviro Service Dispatcher",
    short: "Dispatcher",
    sub: "Field service",
    icon: Wrench,
    modules: ["overview", "tickets", "assets", "contacts", "field", "activity"],
    defaultModule: "tickets",
  },
  field: {
    label: "Field Technician / Sales Rep",
    short: "Field",
    sub: "Mobile view",
    icon: Smartphone,
    modules: ["field", "tickets", "assets"],
    defaultModule: "field",
  },
};

export const SECTIONS = ["Workspace", "Directory", "Revenue", "Service", "Platform"];
