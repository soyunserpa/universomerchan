"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Search, RefreshCw, FileText, CheckCircle, Clock } from "lucide-react";

interface AdminQuote {
    id: number;
    quoteNumber: string;
    clientName: string;
    clientEmail: string;
    totalPrice: number;
    pdfUrl: string | null;
    status: "active" | "expired" | "converted";
    createdAt: string;
    expiresAt: string | null;
    convertedToOrderId: number | null;
    guestEmail: string | null;
}

export default function AdminQuotesPage() {
    const { authHeaders } = useAdminAuth();
    const [quotes, setQuotes] = useState<AdminQuote[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const fetchQuotes = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (filter !== "all") params.set("status", filter);
        if (search) params.set("search", search);
        params.set("page", String(page));

        fetch(`/api/admin/quotes?${params}`, { headers: authHeaders() })
            .then(r => r.json())
            .then(data => { setQuotes(data.quotes || []); setTotal(data.total || 0); setLoading(false); })
            .catch((e) => { console.error(e); setLoading(false); });
    };

    useEffect(() => { fetchQuotes(); }, [filter, search, page]);

    const filters = [
        { v: "all", l: "Todos" },
        { v: "active", l: "Activos" },
        { v: "converted", l: "Convertidos" },
        { v: "expired", l: "Expirados" },
    ];

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-display font-extrabold text-2xl">Presupuestos</h1>
                <span className="text-sm text-gray-400">{total} presupuestos</span>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        placeholder="Buscar por nº presupuesto o email..."
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
                ) : quotes.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No hay presupuestos con estos filtros</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-surface-200 text-left">
                                    {["Número", "Cliente", "Importe", "Estado", "Creado", "Vence"].map(h => (
                                        <th key={h} className="px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map(q => (
                                    <tr key={q.quoteNumber} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {q.pdfUrl ? (
                                                    <a href={q.pdfUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-600 hover:underline flex items-center gap-1">
                                                        <FileText size={14} /> {q.quoteNumber}
                                                    </a>
                                                ) : (
                                                    <span className="font-semibold text-brand-red">{q.quoteNumber}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium">{q.clientName}</span>
                                            <span className="block text-[10px] text-gray-400">{q.clientEmail}</span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold">{q.totalPrice.toFixed(2)}€</td>
                                        <td className="px-4 py-3">
                                            {q.status === 'active' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Activo</span>}
                                            {q.status === 'converted' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600 flex items-center gap-1 w-fit"><CheckCircle size={10} /> Convertido</span>}
                                            {q.status === 'expired' && <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 flex items-center gap-1 w-fit"><Clock size={10} /> Expirado</span>}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {new Date(q.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                            {q.expiresAt ? new Date(q.expiresAt).toLocaleDateString() : '—'}
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
