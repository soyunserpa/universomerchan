"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import {
  RefreshCw, Database, Check, X, Clock, Zap, Package, Tag, Palette, BarChart3,
  Boxes, Leaf, Layers, Activity, AlertTriangle, CheckCircle2, TrendingUp,
} from "lucide-react";

interface SyncEntry {
  id: number; syncType: string; status: string; recordsProcessed: number;
  recordsUpdated: number; recordsCreated: number; durationMs: number;
  errorMessage: string | null; startedAt: string;
}

interface CatalogStats {
  totalProducts: number; visibleProducts: number; hiddenProducts: number;
  printableProducts: number; greenProducts: number; totalVariants: number;
  categoryCounts: Array<{ category: string; count: number }>; lastSyncAt: string | null;
}

const SYNC_LABELS: Record<string, string> = {
  stock: "Stock", products: "Productos", pricelist: "Precios",
  print_pricelist: "Precios impresión", print_data: "Datos impresión", full: "Completa",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora mismo";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export default function AdminSyncPage() {
  const { authHeaders, logout } = useAdminAuth();
  const [logs, setLogs] = useState<SyncEntry[]>([]);
  const [catalog, setCatalog] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleAuth = async (r: Response) => {
    if (r.status === 401 || r.status === 403) { logout(); throw new Error("Unauthorized"); }
    if (!r.ok) throw new Error("Auth/Network Error");
    return r.json();
  };

  const fetchData = () => {
    Promise.all([
      fetch("/api/admin/sync/status", { headers: authHeaders() }).then(handleAuth)
        .then(data => setLogs(Array.isArray(data) ? data : (data.logs || [])))
        .catch(() => setLogs([])),
      fetch("/api/admin/catalog/stats", { headers: authHeaders() }).then(handleAuth)
        .then(data => setCatalog(data))
        .catch(() => setCatalog(null)),
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const triggerSync = async (type: string) => {
    setSyncing(type);
    await fetch("/api/admin/sync/trigger", {
      method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setTimeout(() => { setSyncing(null); fetchData(); }, 3000);
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

  // ---- Derived KPIs ----
  const lastSync = logs[0];
  const recent = logs.slice(0, 20);
  const failed = recent.filter(l => l.status !== "success").length;
  const successRate = recent.length ? Math.round(((recent.length - failed) / recent.length) * 100) : 100;
  const recordsToday = logs
    .filter(l => Date.now() - new Date(l.startedAt).getTime() < 86400000)
    .reduce((sum, l) => sum + (l.recordsUpdated || 0) + (l.recordsCreated || 0), 0);

  const healthy = failed === 0;
  const printablePct = catalog && catalog.totalProducts
    ? Math.round((catalog.printableProducts / catalog.totalProducts) * 100) : 0;

  const kpis = [
    {
      icon: Boxes, label: "Productos en catálogo",
      value: catalog?.totalProducts ?? "—",
      sub: catalog ? `${catalog.visibleProducts} visibles · ${catalog.hiddenProducts} ocultos` : "",
      tint: "text-brand-red bg-red-50",
    },
    {
      icon: Layers, label: "Variantes",
      value: catalog?.totalVariants ?? "—",
      sub: catalog ? `${catalog.categoryCounts.length} categorías` : "",
      tint: "text-indigo-600 bg-indigo-50",
    },
    {
      icon: Palette, label: "Personalizables",
      value: catalog?.printableProducts ?? "—",
      sub: catalog ? `${printablePct}% del catálogo` : "",
      tint: "text-purple-600 bg-purple-50",
    },
    {
      icon: Leaf, label: "Productos eco",
      value: catalog?.greenProducts ?? "—",
      sub: "Línea sostenible",
      tint: "text-green-600 bg-green-50",
    },
    {
      icon: TrendingUp, label: "Registros (24h)",
      value: recordsToday.toLocaleString("es-ES"),
      sub: "Creados + actualizados",
      tint: "text-amber-600 bg-amber-50",
    },
    {
      icon: Activity, label: "Fiabilidad sync",
      value: `${successRate}%`,
      sub: `${recent.length - failed}/${recent.length} correctas`,
      tint: failed === 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50",
    },
  ];

  return (
    <div>
      {/* Header + health banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl">Sincronización con Midocean</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {lastSync ? <>Última actividad {relativeTime(lastSync.startedAt)} · {SYNC_LABELS[lastSync.syncType] || lastSync.syncType}</> : "Sin sincronizaciones registradas"}
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold ${healthy ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {healthy ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {healthy ? "Todo operativo" : `${failed} ${failed === 1 ? "sync con error" : "syncs con error"}`}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-8">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-surface-200 p-4 hover:shadow-sm transition-shadow">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${k.tint}`}>
              <k.icon size={18} />
            </div>
            <p className="font-display font-extrabold text-2xl leading-none tabular-nums">
              {loading ? <span className="inline-block w-10 h-6 bg-surface-100 rounded animate-pulse" /> : k.value}
            </p>
            <p className="text-xs font-semibold text-gray-600 mt-1.5">{k.label}</p>
            {k.sub && <p className="text-[11px] text-gray-400 mt-0.5">{k.sub}</p>}
          </div>
        ))}
      </div>

      {/* Sync triggers */}
      <h2 className="font-display font-bold text-sm text-gray-500 uppercase tracking-wide mb-3">Lanzar sincronización</h2>
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
                  Última: {relativeTime(last.startedAt)}
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
          <button onClick={fetchData} className="text-gray-400 hover:text-gray-600"><RefreshCw size={14} /></button>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-32"><RefreshCw className="animate-spin text-gray-300" /></div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
            <Database size={24} className="opacity-40" />
            <p className="text-sm">Sin sincronizaciones registradas todavía</p>
          </div>
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
                  <tr key={l.id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="px-3 py-2 font-medium">{SYNC_LABELS[l.syncType] || l.syncType}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${l.status === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 tabular-nums">{l.recordsProcessed}</td>
                    <td className="px-3 py-2 text-gray-500 tabular-nums">{l.recordsUpdated}</td>
                    <td className="px-3 py-2 text-gray-500 tabular-nums">{l.recordsCreated}</td>
                    <td className="px-3 py-2 text-gray-500 tabular-nums">{l.durationMs ? `${(l.durationMs / 1000).toFixed(1)}s` : "—"}</td>
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
