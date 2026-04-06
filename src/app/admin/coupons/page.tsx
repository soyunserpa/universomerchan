"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Tag, Percent, Euro } from "lucide-react";

type Coupon = {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderValue: string | null;
  usageLimit: number | null;
  usageCount: number;
  freeShipping: boolean;
  isActive: boolean;
  expiresAt: string | null;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    minOrderValue: "",
    usageLimit: "",
    freeShipping: false,
    isActive: true,
    expiresAt: "",
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.coupons);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openNewModal = () => {
    setEditingCoupon(null);
    setFormData({
      code: "", discountType: "percentage", discountValue: "", 
      minOrderValue: "", usageLimit: "", freeShipping: false, isActive: true, expiresAt: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue || "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      freeShipping: coupon.freeShipping || false,
      isActive: coupon.isActive,
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isEditing = !!editingCoupon;
    const url = isEditing ? `/api/admin/coupons/${editingCoupon.id}` : "/api/admin/coupons";
    const method = isEditing ? "PUT" : "POST";

    const payload = {
      ...formData,
      discountValue: parseFloat(formData.discountValue),
      minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
      usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
    };

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert("Error guardando el cupón");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este cupón?")) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (res.ok) fetchCoupons();
    } catch (error) {
      alert("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold font-display text-gray-900">Cupones de Descuento</h1>
        <button onClick={openNewModal} className="bg-brand-red text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-brand-red-dark">
          <Plus size={16} /> Crear cupón
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-6 py-4">Código</th>
              <th className="px-6 py-4">Descuento</th>
              <th className="px-6 py-4">Límites</th>
              <th className="px-6 py-4">Uso</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">Cargando cupones...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No hay cupones creados</td></tr>
            ) : coupons.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <span className="font-mono font-bold bg-gray-100 px-2 py-1 rounded text-gray-800">{c.code}</span>
                </td>
                <td className="px-6 py-4 font-semibold text-brand-red">
                  {c.discountType === "percentage" ? `${parseFloat(c.discountValue)}%` : `${parseFloat(c.discountValue)}€`}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {c.minOrderValue ? `Min: ${parseFloat(c.minOrderValue)}€` : "Sin mín."}
                  {c.expiresAt && <div className="text-xs text-gray-400">Exp: {new Date(c.expiresAt).toLocaleDateString()}</div>}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className="font-semibold">{c.usageCount}</span>
                  {c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEditModal(c)} title="Editar cupón" className="text-gray-400 hover:text-blue-600"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(c.id)} title="Eliminar cupón" className="text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl relative animate-fade-in">
            <h2 className="text-xl font-bold mb-6 font-display">{editingCoupon ? "Editar Cupón" : "Nuevo Cupón"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Código *</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} required className="w-full border rounded-lg px-3 py-2 font-mono uppercase" placeholder="Ej. VERANO20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Tipo *</label>
                  <select title="Tipo de descuento" value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})} className="w-full border rounded-lg px-3 py-2">
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Fijo (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Valor *</label>
                  <input type="number" step="0.01" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: e.target.value})} required className="w-full border rounded-lg px-3 py-2" placeholder="Ej. 20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Pedido Mínimo (€)</label>
                  <input type="number" step="0.01" value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Límite de Usos</label>
                  <input type="number" value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: e.target.value})} className="w-full border rounded-lg px-3 py-2" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Caduca el</label>
                  <input title="Fecha de caducidad" placeholder="Fecha límite" type="date" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                </div>
                <div className="flex items-end pb-2 mt-4 col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.freeShipping} onChange={e => setFormData({...formData, freeShipping: e.target.checked})} className="w-5 h-5 rounded text-brand-red focus:ring-brand-red" />
                    <span className="text-sm font-semibold">Ofrece Envío Gratis</span>
                  </label>
                </div>
                <div className="flex items-end pb-2 sm:mt-4 col-span-2 sm:col-span-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-5 h-5 rounded text-brand-red focus:ring-brand-red" />
                    <span className="text-sm font-semibold">Cupón Activo</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 font-semibold hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-brand-red text-white font-semibold rounded-lg hover:bg-brand-red-dark">Guardar Cupón</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
