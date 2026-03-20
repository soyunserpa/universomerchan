"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Package, Palette, Check, RefreshCw, Save, Users, Settings } from "lucide-react";

interface AdminSettings {
  marginProductPct: number; marginPrintPct: number; adminEmail: string;
  syncProductsIntervalHours: number; syncStockIntervalMinutes: number;
  lowStockThreshold: number; quoteValidityDays: number; cartAbandonedHours: number;
}

interface Client { id: number; email: string; firstName: string; lastName: string; companyName: string | null; discountPercent: number }

export default function AdminSettingsPage() {
  const { authHeaders } = useAdminAuth();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [marginProd, setMarginProd] = useState(40);
  const [marginPrint, setMarginPrint] = useState(50);

  useEffect(() => {
    const h = authHeaders();
    Promise.all([
      fetch("/api/admin/settings", { headers: h }).then(r => r.json()),
      fetch("/api/admin/clients?limit=50", { headers: h }).then(r => r.json()),
    ]).then(([s, c]) => {
      setSettings(s);
      setMarginProd(s.marginProductPct);
      setMarginPrint(s.marginPrintPct);
      setClients(c.clients || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authHeaders]);

  const saveMargins = async () => {
    await fetch("/api/admin/settings/margins", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ productMarginPct: marginProd, printMarginPct: marginPrint }),
    });
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveDiscount = async (clientId: number, discount: number) => {
    await fetch("/api/admin/clients/discount", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, discountPercent: discount }),
    });
  };

  const saveSetting = async (key: string, value: string) => {
    await fetch("/api/admin/settings/update", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-gray-300" /></div>;

  // Example calculation
  const exProductCost = 241;
  const exPrintCost = 89;
  const exProductSell = exProductCost * (1 + marginProd / 100);
  const exPrintSell = exPrintCost * (1 + marginPrint / 100);
  const exTotal = exProductSell + exPrintSell;

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl mb-6">Márgenes y configuración</h1>

      {/* Dual Margins */}
      <div className="bg-white rounded-xl border border-surface-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="font-display font-bold text-base">Control de márgenes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Configura el margen sobre coste Midocean para productos y marcaje por separado</p>
          </div>
          {saved && <span className="text-xs font-semibold text-green-600 flex items-center gap-1"><Check size={14} /> Guardado</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Product margin */}
          <div className="bg-surface-50 rounded-xl p-5 border border-surface-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center"><Package size={16} className="text-blue-600" /></div>
              <div>
                <p className="text-sm font-bold">Margen de producto</p>
                <p className="text-[11px] text-gray-400">Sobre precio base Midocean</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={marginProd} onChange={e => setMarginProd(Number(e.target.value))} className="w-20 py-2 px-3 border-2 border-surface-200 rounded-lg text-xl font-display font-extrabold text-center" />
              <span className="text-xl font-display font-extrabold text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Ej: Producto 4.82€ → PVP {(4.82 * (1 + marginProd / 100)).toFixed(2)}€</p>
          </div>

          {/* Print margin */}
          <div className="bg-surface-50 rounded-xl p-5 border border-surface-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-pink-100 flex items-center justify-center"><Palette size={16} className="text-pink-600" /></div>
              <div>
                <p className="text-sm font-bold">Margen de marcaje</p>
                <p className="text-[11px] text-gray-400">Sobre costes de impresión</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" value={marginPrint} onChange={e => setMarginPrint(Number(e.target.value))} className="w-20 py-2 px-3 border-2 border-surface-200 rounded-lg text-xl font-display font-extrabold text-center" />
              <span className="text-xl font-display font-extrabold text-gray-400">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Incluye: setup + impresión + handling</p>
          </div>

          {/* Example + Save */}
          <div className="flex flex-col justify-between">
            <div className="bg-gray-900 rounded-xl p-4 text-white text-xs">
              <p className="text-gray-500 mb-2">Ejemplo: Botella 50 uds + serigrafía</p>
              <div className="flex justify-between mb-1"><span className="opacity-60">Coste producto</span><span>241€ → <b>{exProductSell.toFixed(0)}€</b></span></div>
              <div className="flex justify-between mb-1"><span className="opacity-60">Coste marcaje</span><span>89€ → <b>{exPrintSell.toFixed(0)}€</b></span></div>
              <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
                <span className="font-bold">PVP total</span>
                <span className="font-extrabold text-brand-red text-base">{exTotal.toFixed(0)}€</span>
              </div>
            </div>
            <button onClick={saveMargins} className="mt-3 w-full bg-brand-red text-white py-2.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors">
              <Save size={14} /> Guardar márgenes
            </button>
          </div>
        </div>
      </div>

      {/* Per-client discounts */}
      <div className="bg-white rounded-xl border border-surface-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-brand-red" />
          <h2 className="font-display font-bold text-base">Descuentos por cliente</h2>
        </div>
        {clients.length === 0 ? (
          <p className="text-sm text-gray-400">No hay clientes registrados todavía</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {clients.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl border border-surface-200">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-brand-red flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {c.firstName?.[0]}{c.lastName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{c.firstName} {c.lastName}</p>
                    {c.companyName && <p className="text-[10px] text-gray-400 truncate">{c.companyName}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <input
                    type="number"
                    defaultValue={c.discountPercent}
                    onBlur={e => saveDiscount(c.id, Number(e.target.value))}
                    className="w-12 py-1 px-2 border border-surface-200 rounded text-xs font-bold text-center"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* General settings */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={16} className="text-brand-red" />
          <h2 className="font-display font-bold text-base">Configuración general</h2>
        </div>
        {settings && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: "low_stock_threshold", label: "Umbral stock bajo (uds)", value: settings.lowStockThreshold },
              { key: "quote_validity_days", label: "Validez presupuestos (días)", value: settings.quoteValidityDays },
              { key: "cart_abandoned_hours", label: "Carrito abandonado (horas)", value: settings.cartAbandonedHours },
              { key: "sync_stock_interval_minutes", label: "Sync stock (minutos)", value: settings.syncStockIntervalMinutes },
            ].map(s => (
              <div key={s.key} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                <span className="text-sm text-gray-600">{s.label}</span>
                <input
                  type="number"
                  defaultValue={s.value}
                  onBlur={e => saveSetting(s.key, e.target.value)}
                  className="w-16 py-1 px-2 border border-surface-200 rounded text-sm font-bold text-center"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
