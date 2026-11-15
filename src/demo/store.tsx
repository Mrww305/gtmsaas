import React, { createContext, useContext } from "react";
import type { User } from "./api";

export type DemoData = {
  user: User;
  meta: { demoDays: number; today: string; mail: { configured: boolean; user: string | null; notify: string } };
  verticals: any[];
  accounts: any[];
  contacts: any[];
  products: any[];
  assets: any[];
  opportunities: any[];
  orders: any[];
  tickets: any[];
  technicians: any[];
  erp: any;
  usage: Array<{ action: string; count: number }>;
  activity: any[];
  metrics: {
    pipeline: number;
    won: number;
    orderValue: number;
    creditExposure: number;
    creditLimit: number;
    atRisk: number;
    openTickets: number;
    resolvedTickets: number;
    totalTickets: number;
    crossSell: number;
    accounts: number;
    revenueByVertical: Array<{ name: string; value: number }>;
    ticketStatus: Array<{ name: string; value: number }>;
    orderTrend: Array<{ name: string; value: number }>;
  };
};

type Ctx = {
  data: DemoData | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  toast: (message: string, tone?: "success" | "error" | "info") => void;
};

export const DemoContext = createContext<Ctx | null>(null);

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used inside DemoContext");
  return ctx;
}
