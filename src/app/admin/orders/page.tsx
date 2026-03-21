"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import Link from "next/link";
import { Search, RefreshCw, ChevronRight, Eye, AlertTriangle, Truck, ExternalLink } from "lucide-react";

interface AdminOrder {
  id: number; orderNumber: string; midoceanOrderNumber: string | null;
  status: string; statusLabel: string; statusColor: string; orderType: string;
  clientName: string; clientEmail: string; clientCompany: string | null;
  totalPrice: number; profit: number; profitMarginPct: number;
  createdAt: string; trackingNumber: string | null; forwarder: string | null;
  lineCount: number; hasCustomization: boolean; proofsPending: number;
  customizations?: { artworkUrl: string; mockupUrl: string }[];
  lastError: string | null; errorCount: number;
}

export default function AdminOrdersPage() {
  const { authHeaders } = useAdminAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const fetchOrders = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== "all") params.set("status", filter);
    if (search) params.set("search", search);
    params.set("page", String(page));
    fetch(`/api/admin/orders?${params}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => { setOrders(data.orders || []); setTotal(data.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter, search, page]);

  const filters = [
    { v: "all", l: "Todos" }, { v: "paid", l: "Pagados" }, { v: "submitted", l: "En Midocean" },
    { v: "proof_pending", l: "Proof pendiente" }, { v: "in_production", l: "Producción" },
    { v: "shipped", l: "Enviados" }, { v: "completed", l: "Completados" }, { v: "error", l: "Errores" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl">Pedidos</h1>
        <span className="text-sm text-gray-400">{total} pedidos</span>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por nº pedido, cliente, email..."
            className="w-full pl-9 pr-4 py-2 border-2 border-surface-200 rounded-xl text-sm"
          />
        </div>
      </div>
      <div className="flex gap-1.5 flex-wrap mb-5">
        {filters.map(f => (
          <button key={f.v} onClick={() => { setFilter(f.v); setPage(1); }} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === f.v ? "bg-brand-red text-white" : "bg-surface-100 text-gray-500 hover:bg-surface-200"}`}>
            {f.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin text-gray-300" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No hay pedidos con estos filtros</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left">
                  {["Pedido", "Cliente", "Tipo", "Total", "Beneficio", "Estado", "Proofs", ""].map(h => (
                    <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.orderNumber} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-brand-red">{o.orderNumber}</span>
                      {o.midoceanOrderNumber && <span className="block text-[10px] text-gray-400">MO: {o.midoceanOrderNumber}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{o.clientName}</span>
                      {o.clientCompany && <span className="block text-[10px] text-gray-400">{o.clientCompany}</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${o.hasCustomization ? "bg-purple-50 text-purple-700" : "bg-surface-100 text-gray-500"}`}>
                        {o.hasCustomization ? "MARCAJE" : "NORMAL"}
                      </span>
                      {o.customizations && o.customizations.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {o.customizations.map((c, i) => (
                            <div key={i} className="flex gap-1.5">
                              {c.artworkUrl && <a href={c.artworkUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-blue-100"><ExternalLink size={8} /> Arte</a>}
                              {c.mockupUrl && <a href={c.mockupUrl} target="_blank" rel="noreferrer" className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-purple-100"><ExternalLink size={8} /> Boceto</a>}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold">{o.totalPrice.toFixed(2)}€</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${o.profit >= 0 ? "text-green-600" : "text-red-500"}`}>{o.profit.toFixed(0)}€</span>
                      <span className="block text-[10px] text-gray-400">{o.profitMarginPct}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: o.statusColor + "20", color: o.statusColor }}>
                        {o.statusLabel}
                      </span>
                      {o.lastError && <AlertTriangle size={12} className="text-red-500 inline ml-1.5" />}
                    </td>
                    <td className="px-4 py-3">
                      {o.proofsPending > 0 && <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit"><Eye size={10} /> {o.proofsPending}</span>}
                      {o.trackingNumber && <span className="text-xs text-green-600 flex items-center gap-1"><Truck size={10} /> {o.forwarder}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.orderNumber}`} className="text-gray-400 hover:text-brand-red"><ChevronRight size={16} /></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
