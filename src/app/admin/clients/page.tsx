"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Search, RefreshCw, Users, ShoppingCart, UserCheck, UserX } from "lucide-react";

interface Client {
  id: number; email: string; firstName: string; lastName: string;
  companyName: string | null; cif: string | null; phone: string | null;
  discountPercent: number; totalOrders: number; totalSpent: number;
  lastOrderDate: string | null; createdAt: string; isActive: boolean;
}

export default function AdminClientsPage() {
  const { authHeaders } = useAdminAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    fetch(`/api/admin/clients?${params}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setClients(d.clients || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, authHeaders]);

  const toggleActive = async (id: number, active: boolean) => {
    await fetch("/api/admin/clients/active", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, active }),
    });
    setClients(prev => prev.map(c => c.id === id ? { ...c, isActive: active } : c));
  };

  const saveDiscount = async (id: number, discount: number) => {
    await fetch("/api/admin/clients/discount", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: id, discountPercent: discount }),
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl">Clientes</h1>
        <span className="text-sm text-gray-400">{total} clientes</span>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email, empresa..." className="w-full max-w-md pl-9 pr-4 py-2 border-2 border-surface-200 rounded-xl text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin text-gray-300" /></div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No hay clientes registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left">
                  {["Estado", "Cliente", "Empresa", "Pedidos", "Total gastado", "Último pedido", "Descuento", "Desde"].map(h => (
                    <th key={h} className="px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleActive(c.id, !c.isActive)} className={`p-1.5 rounded-lg transition-colors ${c.isActive ? "bg-green-50 text-green-600" : "bg-red-50 text-red-400"}`}>
                        {c.isActive ? <UserCheck size={14} /> : <UserX size={14} />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{c.firstName} {c.lastName}</p>
                      <p className="text-[10px] text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {c.companyName || "—"}
                      {c.cif && <span className="block text-[10px] text-gray-400">{c.cif}</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-1 text-xs"><ShoppingCart size={11} className="text-gray-400" /> {c.totalOrders}</span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-xs">{c.totalSpent.toFixed(0)}€</td>
                    <td className="px-3 py-3 text-xs text-gray-400">
                      {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" }) : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <input
                          type="number" defaultValue={c.discountPercent}
                          onBlur={e => saveDiscount(c.id, Number(e.target.value))}
                          className="w-12 py-0.5 px-1.5 border border-surface-200 rounded text-xs font-bold text-center"
                        />
                        <span className="text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" })}
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
