"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Search, TrendingUp, RefreshCw } from "lucide-react";

interface SearchStat {
  query: string;
  count: number;
}

export default function AdminSearchesPage() {
  const { authHeaders, logout } = useAdminAuth();
  const [searches, setSearches] = useState<SearchStat[]>([]);
  const [totalSearches, setTotalSearches] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/searches?limit=30", { headers: authHeaders() })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          logout();
          return;
        }
        setSearches(data.searches || []);
        setTotalSearches(data.totalSearches || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [authHeaders, logout]);

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-gray-300" /></div>;

  const maxCount = Math.max(...searches.map(s => s.count), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl flex items-center gap-2">
            <Search className="text-brand-red" size={24} /> Búsquedas Frecuentes
          </h1>
          <p className="text-xs text-gray-400">Términos introducidos por los usuarios en el buscador principal.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <div className="bg-white rounded-xl p-5 border border-surface-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2 text-gray-500">
            <TrendingUp size={20} className="text-brand-red" />
            <span className="text-sm font-semibold">Total búsquedas históricas</span>
          </div>
          <div className="text-5xl font-extrabold text-gray-900">{totalSearches}</div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 p-5 shadow-sm">
          <h2 className="font-display font-bold text-sm mb-4">Top 30 Búsquedas</h2>
          {searches.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay búsquedas suficientes registradas.</p>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {searches.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium truncate mr-2">{s.query} <span className="text-gray-400 font-normal">({s.count} veces)</span></span>
                    <span className="text-brand-red flex-shrink-0 font-semibold">{Math.round((s.count / totalSearches) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: `${Math.max((s.count / maxCount) * 100, 2)}%`,
                        backgroundColor: i < 3 ? "#DE0121" : "#A1A1AA",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
