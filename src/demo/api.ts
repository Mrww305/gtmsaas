export type User = {
  id: number;
  email: string;
  name: string;
  company: string | null;
  role: string | null;
  useCase: string | null;
  teamSize: string | null;
  verified: boolean;
  onboarded: boolean;
  termsAccepted: boolean;
  createdAt: string;
};

export type ApiError = Error & { status?: number; data?: any };

export async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err: ApiError = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

export const money = (value: number | string | null | undefined, compact = false) => {
  const n = Number(value || 0);
  if (compact) {
    if (Math.abs(n) >= 1_000_000_000) return `PKR ${(n / 1_000_000_000).toFixed(1)}B`;
    if (Math.abs(n) >= 1_000_000) return `PKR ${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `PKR ${(n / 1_000).toFixed(0)}K`;
  }
  return `PKR ${n.toLocaleString("en-PK")}`;
};

export const dateShort = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const timeShort = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};
