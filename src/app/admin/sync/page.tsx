"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { RefreshCw, Database, Check, X, Clock, Zap, Package, Tag, Palette, BarChart3 } from "lucide-react";

interface SyncEntry {
  id: number; syncType: string; status: string; recordsProcessed: number;
  recordsUpdated: number; recordsCreated: number; durationMs: number;
  errorMessage: string | null; startedAt: string;
}

export default function AdminSyncPage() {
  const { authHeaders } = useAdminAuth();
  const [logs, setLogs] = useState<SyncEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const fetchLogs = () => {
    fetch("/api/admin/sync/status", { headers: authHeaders() })
      .then(r => r.json()).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const triggerSync = async (type: string) => {
    setSyncing(type);
    await fetch("/api/admin/sync/trigger", {
      method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setTimeout(() => { setSyncing(null); fetchLogs(); }, 3000);
  };

  const syncTypes = [
    { type: "stock", label: "Stock", icon: BarChart3, desc: "Cada 30 min" },
    { type: "products", label: "Productos", icon: Package, desc: "Cada 6h" },
    { type: "pricelist", label: "Precios", icon: Tag, desc: "Cada 6h" },
    { type: "print_pricelist", label: "Precios impresión", icon: Palette, desc: "Cada 6h" },
    { type: "print_data", label: "Datos impresión", icon: Database, desc: "Cada 6h" },
    { type: "full", label: "Sincronización completa", icon: Zap, desc: "Todo a la vez" },
  ];

  const lastSyncByType = (type: string) => logs.find(l => l.syncType === type);

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl mb-6">Sincronización con Midocean</h1>

      {/* Sync triggers */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {syncTypes.map(s => {
          const last = lastSyncByType(s.type);
          const isSyncing = syncing === s.type;
          return (
            <div key={s.type} className="bg-white rounded-xl border border-surface-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <s.icon size={16} className="text-brand-red" />
                <span className="text-sm font-semibold">{s.label}</span>
              </div>
              <p className="text-[11px] text-gray-400 mb-1">{s.desc}</p>
              {last && (
                <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
                  <Clock size={9} />
                  Última: {new Date(last.startedAt).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {last.status === "success" ? <Check size={9} className="text-green-500" /> : <X size={9} className="text-red-500" />}
                </p>
              )}
              <button
                onClick={() => triggerSync(s.type)} disabled={!!syncing}
                className="w-full py-1.5 rounded-lg bg-surface-100 text-xs font-medium text-gray-600 hover:bg-surface-200 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
              >
                {isSyncing ? <><RefreshCw size={12} className="animate-spin" /> Sincronizando...</> : <>Sincronizar ahora</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Sync log table */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-200 flex justify-between items-center">
          <h2 className="font-display font-bold text-sm">Historial de sincronizaciones</h2>
          <button onClick={fetchLogs} className="text-gray-400 hover:text-gray-600"><RefreshCw size={14} /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin text-gray-300" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-surface-200">
                  {["Tipo", "Estado", "Procesados", "Actualizados", "Creados", "Duración", "Fecha", "Error"].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b border-surface-100">
                    <td className="px-3 py-2 font-medium">{l.syncType}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${l.status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{l.recordsProcessed}</td>
                    <td className="px-3 py-2 text-gray-500">{l.recordsUpdated}</td>
                    <td className="px-3 py-2 text-gray-500">{l.recordsCreated}</td>
                    <td className="px-3 py-2 text-gray-500">{l.durationMs ? `${(l.durationMs / 1000).toFixed(1)}s` : "—"}</td>
                    <td className="px-3 py-2 text-gray-400">{new Date(l.startedAt).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
                    <td className="px-3 py-2 text-red-500 max-w-[200px] truncate">{l.errorMessage || "—"}</td>
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
