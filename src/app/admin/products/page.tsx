"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Search, Eye, EyeOff, RefreshCw, Leaf, Package, Edit3, Check, X } from "lucide-react";

interface AdminProduct {
  id: number; masterCode: string; name: string; category: string; material: string;
  isVisible: boolean; isGreen: boolean; printable: boolean;
  customPrice: number | null; midoceanPrice: number; sellPrice: number;
  totalStock: number; variantCount: number; printPositionCount: number;
}

export default function AdminProductsPage() {
  const { authHeaders } = useAdminAuth();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingPrice, setEditingPrice] = useState<number | null>(null);
  const [priceValue, setPriceValue] = useState("");

  const fetchProducts = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("limit", "50");
    fetch(`/api/admin/products?${params}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { setProducts(d.products || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const toggleVisibility = async (id: number, visible: boolean) => {
    await fetch("/api/admin/products/visibility", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, visible }),
    });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, isVisible: visible } : p));
  };

  const saveCustomPrice = async (id: number) => {
    const price = priceValue ? parseFloat(priceValue) : null;
    await fetch("/api/admin/products/price", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, customPrice: price }),
    });
    setProducts(prev => prev.map(p => p.id === id ? { ...p, customPrice: price, sellPrice: price || p.midoceanPrice * 1.4 } : p));
    setEditingPrice(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl">Productos</h1>
        <span className="text-sm text-gray-400">{total} productos sincronizados</span>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre o código..." className="w-full max-w-md pl-9 pr-4 py-2 border-2 border-surface-200 rounded-xl text-sm" />
      </div>

      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin text-gray-300" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 text-left">
                  {["Visible", "Producto", "Categoría", "Coste MO", "PVP", "Stock", "Variantes", "Marcaje"].map(h => (
                    <th key={h} className="px-3 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleVisibility(p.id, !p.isVisible)} className={`p-1.5 rounded-lg transition-colors ${p.isVisible ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-400 hover:bg-red-100"}`}>
                        {p.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {p.isGreen && <Leaf size={12} className="text-green-500 flex-shrink-0" />}
                        <div>
                          <span className="font-medium">{p.name}</span>
                          <span className="block text-[10px] text-gray-400">{p.masterCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">{p.category}</td>
                    <td className="px-3 py-3 text-xs text-gray-400">{p.midoceanPrice.toFixed(2)}€</td>
                    <td className="px-3 py-3">
                      {editingPrice === p.id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={priceValue} onChange={e => setPriceValue(e.target.value)} autoFocus className="w-16 px-1.5 py-0.5 border border-surface-200 rounded text-xs" placeholder="Auto" />
                          <button onClick={() => saveCustomPrice(p.id)} className="text-green-500 hover:text-green-700"><Check size={14} /></button>
                          <button onClick={() => setEditingPrice(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingPrice(p.id); setPriceValue(p.customPrice?.toString() || ""); }} className="flex items-center gap-1 text-xs font-semibold hover:text-brand-red transition-colors group">
                          <span className={p.customPrice ? "text-brand-red" : ""}>{p.sellPrice.toFixed(2)}€</span>
                          <Edit3 size={10} className="text-gray-300 group-hover:text-brand-red" />
                          {p.customPrice && <span className="text-[9px] text-brand-red bg-brand-red/10 px-1 rounded">CUSTOM</span>}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-medium ${p.totalStock > 100 ? "text-green-600" : p.totalStock > 0 ? "text-amber-600" : "text-red-500"}`}>
                        {p.totalStock.toLocaleString("es-ES")}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-400">{p.variantCount}</td>
                    <td className="px-3 py-3">
                      {p.printable ? <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded font-medium">{p.printPositionCount} pos.</span> : <span className="text-xs text-gray-300">—</span>}
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
