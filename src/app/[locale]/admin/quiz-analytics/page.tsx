"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { RefreshCw, Filter, ArrowRight, Zap, Target, Users } from "lucide-react";

export default function QuizAnalyticsDashboard() {
  const { authHeaders } = useAdminAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/quiz-analytics", { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-gray-900">Quiz Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Métricas de retención y embudo de las sesiones interactivas (Chatbot).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchAnalytics}
            className="p-2 border border-surface-200 bg-white rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
           <RefreshCw className="animate-spin mb-3 text-brand-red" size={32} />
           <p className="font-medium">Calculando gráficas...</p>
        </div>
      ) : data ? (
        <div className="flex-1 flex flex-col space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-gray-900">{data.summary.totalOpens}</div>
                        <div className="text-sm font-medium text-gray-500">Sesiones Únicas</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                        <Target size={24} />
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-gray-900">{data.summary.totalLeads}</div>
                        <div className="text-sm font-medium text-gray-500">Leads Capturados</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Zap size={24} />
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-gray-900">{data.summary.conversionRate}%</div>
                        <div className="text-sm font-medium text-gray-500">Tasa de Conversión</div>
                    </div>
                </div>
            </div>

            {/* Funnel Graph */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-6 border-b border-gray-100 pb-4">Caída del Embudo (Drop-off Rate)</h3>
                
                <div className="space-y-5 mt-4">
                    {data.funnel.map((item: any, index: number) => {
                        const previousCount = index === 0 ? item.count : data.funnel[0].count;
                        const percentageOfTotal = previousCount > 0 ? (item.count / previousCount) * 100 : 0;
                        const stepDropoff = index > 0 && data.funnel[index-1].count > 0 
                            ? (100 - (item.count / data.funnel[index-1].count) * 100).toFixed(1)
                            : "0.0";

                        const isActionable = item.id !== "opened" && item.id !== "started_wizard" && item.id !== "completed_lead";

                        return (
                            <div key={item.id} className="relative">
                                <div className="flex items-center justify-between mb-1.5 z-10 relative px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-sm text-gray-800">{item.step}</div>
                                        {isActionable && parseFloat(stepDropoff) > 20 && (
                                            <span className="bg-red-50 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                                Fricción alta (-{stepDropoff}%)
                                            </span>
                                        )}
                                    </div>
                                    <div className="font-extrabold text-sm text-gray-900">
                                        {item.count} <span className="text-gray-400 font-medium text-xs">({percentageOfTotal.toFixed(1)}%)</span>
                                    </div>
                                </div>
                                <div className="h-6 w-full bg-gray-50 rounded-lg overflow-hidden flex items-center relative">
                                    <div 
                                        className="h-full bg-gradient-to-r from-brand-red to-brand-red-light transition-all duration-1000 ease-out flex items-center justify-end px-3 text-white text-xs font-bold"
                                        style={{ width: `${percentageOfTotal}%` }}
                                    >
                                        {percentageOfTotal > 10 && `${percentageOfTotal.toFixed(0)}%`}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
           <Filter size={32} className="mb-3 text-gray-300" />
           <p className="font-medium text-sm">No hay datos de interacciones todavía.</p>
        </div>
      )}
    </div>
  );
}
