"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { AlertTriangle, Check, RefreshCw, Filter, Package, Zap, CreditCard, Eye, Database } from "lucide-react";

interface ErrorEntry {
  id: number; errorType: string; severity: string; message: string;
  context: any; orderId: number | null; orderNumber: string | null;
  resolved: boolean; createdAt: string;
}

export default function AdminErrorsPage() {
  const { authHeaders, user } = useAdminAuth();
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResolved, setShowResolved] = useState(false);

  const fetchErrors = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("resolved", String(showResolved));
    fetch(`/api/admin/errors?${params}`, { headers: authHeaders() })
      .then(r => r.json()).then(setErrors).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchErrors(); }, [showResolved]);

  const resolveError = async (errorId: number) => {
    await fetch("/api/admin/errors/resolve", {
      method: "PUT", headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ errorId }),
    });
    setErrors(prev => prev.filter(e => e.id !== errorId));
  };

  const severityColors: Record<string, string> = {
    low: "bg-blue-50 text-blue-700", medium: "bg-amber-50 text-amber-700",
    high: "bg-red-50 text-red-700", critical: "bg-red-100 text-red-800",
  };

  const typeIcons: Record<string, any> = {
    stock_insufficient: Package, order_api_error: Database, proof_rejected: Eye,
    payment_failed: CreditCard, sync_error: RefreshCw, low_stock: Zap,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-extrabold text-2xl">Errores y alertas</h1>
        <span className="text-sm text-gray-400">{errors.length} {showResolved ? "resueltos" : "pendientes"}</span>
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={() => setShowResolved(false)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${!showResolved ? "bg-brand-red text-white" : "bg-surface-100 text-gray-500"}`}>
          Pendientes
        </button>
        <button onClick={() => setShowResolved(true)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${showResolved ? "bg-brand-red text-white" : "bg-surface-100 text-gray-500"}`}>
          Resueltos
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><RefreshCw className="animate-spin text-gray-300" /></div>
      ) : errors.length === 0 ? (
        <div className="bg-white rounded-xl border border-surface-200 p-12 text-center">
          <Check size={40} className="text-green-400 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{showResolved ? "No hay errores resueltos" : "Todo limpio — no hay errores pendientes"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map(err => {
            const Icon = typeIcons[err.errorType] || AlertTriangle;
            return (
              <div key={err.id} className="bg-white rounded-xl border border-surface-200 p-4 flex items-start gap-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${severityColors[err.severity]?.split(" ")[0] || "bg-gray-100"}`}>
                  <Icon size={16} className={severityColors[err.severity]?.split(" ")[1] || "text-gray-500"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${severityColors[err.severity] || "bg-gray-100 text-gray-500"}`}>
                      {err.severity}
                    </span>
                    <span className="text-[10px] text-gray-400 bg-surface-100 px-1.5 py-0.5 rounded">{err.errorType}</span>
                    {err.orderNumber && (
                      <span className="text-[10px] text-brand-red font-semibold">{err.orderNumber}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{err.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(err.createdAt).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!err.resolved && (
                  <button onClick={() => resolveError(err.id)} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors flex items-center gap-1">
                    <Check size={12} /> Resolver
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
