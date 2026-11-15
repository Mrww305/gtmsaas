import React, { useMemo, useState } from "react";
import { Building2, HardDrive, Package, Search, Users } from "lucide-react";
import { useDemo } from "../store";
import { Badge, Card, CardHeader, Empty, Input, Modal, Progress, Select, statusTone, cn } from "../ui";
import { dateShort, money } from "../api";

type Module = "accounts" | "contacts" | "catalog" | "assets";

const TITLES: Record<Module, { title: string; subtitle: string; icon: any }> = {
  accounts: { title: "Accounts", subtitle: "Unified B2B and channel directory", icon: Building2 },
  contacts: { title: "Contacts", subtitle: "End consumers, dealer owners and procurement heads", icon: Users },
  catalog: { title: "Product catalog", subtitle: "Appliance, commercial and industrial SKUs", icon: Package },
  assets: { title: "Customer assets", subtitle: "Serial numbers and warranty registry", icon: HardDrive },
};

export default function Directory({ module }: { module: Module }) {
  const { data } = useDemo();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<any>(null);

  if (!data) return null;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list: any[] = [];
    if (module === "accounts") list = data.accounts;
    if (module === "contacts") list = data.contacts;
    if (module === "catalog") list = data.products;
    if (module === "assets") list = data.assets;

    if (filter !== "all") {
      list = list.filter((r) => {
        if (module === "accounts") return r.account_type === filter || r.tier === filter || r.region === filter;
        if (module === "contacts") return r.contact_type === filter || r.city === filter;
        if (module === "catalog") return r.category === filter;
        if (module === "assets") return r.warranty_status === filter;
        return true;
      });
    }
    if (!needle) return list;
    return list.filter((r) => JSON.stringify(r).toLowerCase().includes(needle));
  }, [data, module, q, filter]);

  const filterOptions = useMemo(() => {
    if (module === "accounts") return ["all", ...new Set(data.accounts.map((a) => a.account_type)), ...new Set(data.accounts.map((a) => a.tier))];
    if (module === "contacts") return ["all", ...new Set(data.contacts.map((c) => c.contact_type))];
    if (module === "catalog") return ["all", ...new Set(data.products.map((p) => p.category))];
    return ["all", "Active", "Expired", "Void"];
  }, [data, module]);

  const Meta = TITLES[module];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">Directory</div>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-950">
            <Meta.icon className="h-6 w-6 text-slate-400" /> {Meta.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{Meta.subtitle}</p>
        </div>
        <Badge tone="slate">{rows.length} records</Badge>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${Meta.title.toLowerCase()}…`} className="pl-9" />
          </div>
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="sm:w-56">
            {filterOptions.map((o) => <option key={o} value={o}>{o === "all" ? "All records" : o}</option>)}
          </Select>
        </div>

        {rows.length === 0 ? (
          <Empty title="No matching records" hint="Try a different search or filter." />
        ) : module === "accounts" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Account</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">City</th>
                  <th className="px-3 py-2.5 font-semibold">Tier</th>
                  <th className="px-3 py-2.5 font-semibold">Credit utilisation</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((a) => {
                  const pct = Math.round((Number(a.current_balance_pkr) / Math.max(1, Number(a.credit_limit_pkr))) * 100);
                  return (
                    <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{a.name}</td>
                      <td className="px-3 py-3 text-slate-600">{a.account_type}</td>
                      <td className="px-3 py-3 text-slate-600">{a.city} · {a.region}</td>
                      <td className="px-3 py-3"><Badge tone={statusTone(a.tier)}>{a.tier}</Badge></td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-24"><Progress value={pct} tone={pct >= 95 ? "rose" : pct >= 80 ? "amber" : "emerald"} /></div>
                          <span className={cn("text-[11px] font-semibold", pct >= 95 ? "text-rose-600" : pct >= 80 ? "text-amber-600" : "text-slate-600")}>{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-slate-900">{money(a.current_balance_pkr, true)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : module === "contacts" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Name</th>
                  <th className="px-3 py-2.5 font-semibold">WhatsApp</th>
                  <th className="px-3 py-2.5 font-semibold">City</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-5 py-2.5 font-semibold">Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((c) => {
                  const account = data.accounts.find((a) => a.id === c.account_id);
                  return (
                    <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-900">{c.full_name}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-600">{c.phone_whatsapp}</td>
                      <td className="px-3 py-3 text-slate-600">{c.city}</td>
                      <td className="px-3 py-3"><Badge tone={c.contact_type === "End Consumer" ? "slate" : "indigo"}>{c.contact_type}</Badge></td>
                      <td className="px-5 py-3 text-slate-600">{account?.name || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : module === "catalog" ? (
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((p) => (
              <div key={p.id} onClick={() => setSelected(p)} className="cursor-pointer rounded-xl border border-slate-200 p-4 hover:border-indigo-200 hover:bg-indigo-50/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-[10px] font-semibold text-slate-400">{p.sku}</div>
                  <Badge tone="slate">{p.category}</Badge>
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{p.name}</div>
                <div className="mt-1 text-xs text-slate-500">{money(p.unit_price_pkr)} · {p.warranty_months} mo warranty</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-2.5 font-semibold">Serial</th>
                  <th className="px-3 py-2.5 font-semibold">Product</th>
                  <th className="px-3 py-2.5 font-semibold">Owner</th>
                  <th className="px-3 py-2.5 font-semibold">Purchase</th>
                  <th className="px-3 py-2.5 font-semibold">Warranty</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((a) => (
                  <tr key={a.id} onClick={() => setSelected(a)} className="cursor-pointer hover:bg-slate-50">
                    <td className="px-5 py-3 font-mono text-[11px] font-semibold text-slate-900">{a.serial_number}</td>
                    <td className="px-3 py-3 text-slate-600">{a.product_name}</td>
                    <td className="px-3 py-3 text-slate-600">{a.owner_name}<div className="text-[10px] text-slate-400">{a.phone_whatsapp}</div></td>
                    <td className="px-3 py-3 text-slate-600">{dateShort(a.purchase_date)}</td>
                    <td className="px-3 py-3 text-slate-600">{dateShort(a.warranty_expiry_date)}</td>
                    <td className="px-5 py-3"><Badge tone={statusTone(a.warranty_status)}>{a.warranty_status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name || selected?.full_name || selected?.product_name || selected?.serial_number || "Record"} subtitle={Meta.title}>
        {selected ? (
          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(selected)
                .filter(([k]) => !["id", "signature", "payload"].includes(k))
                .map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-slate-200 px-3 py-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k.replace(/_/g, " ")}</div>
                    <div className="mt-0.5 text-xs font-semibold text-slate-800">{String(v ?? "—")}</div>
                  </div>
                ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
