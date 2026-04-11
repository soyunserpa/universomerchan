"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { RefreshCw, Mail, Users, Download, Search } from "lucide-react";

export default function ContactsDashboard() {
  const { authHeaders } = useAdminAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contacts", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredContacts = contacts.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.nombre && c.nombre.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.empresa && c.empresa.toLowerCase().includes(term))
    );
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-gray-900">Contactos Globales</h1>
          <p className="text-sm text-gray-500 mt-1">Directorio consolidado sin duplicados (Clientes + Entradas CRM).</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/admin/contacts?format=csv"
            download
            className="flex items-center gap-2 px-4 py-2 bg-brand-red text-white text-sm font-bold rounded-lg hover:bg-brand-red-dark transition-colors shadow-sm"
          >
            <Download size={16} /> Exportar BBDD Pura (CSV)
          </a>
          <button
            onClick={fetchContacts}
            className="p-2 border border-surface-200 bg-white rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex-1 flex flex-col shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por email, nombre o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
            />
          </div>
          <div className="text-sm font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
            {filteredContacts.length} <span className="font-normal">Contactos Únicos</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr className="text-left text-xs uppercase font-bold text-gray-500 tracking-wider">
                <th className="px-6 py-4">Origen</th>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Empresa / Sector</th>
                <th className="px-6 py-4">Info Quiz</th>
                <th className="px-6 py-4">F. Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <RefreshCw className="animate-spin mx-auto text-brand-red mb-3" size={24} />
                    Mapeando miles de registros...
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-medium bg-gray-50/50">
                    No se encontraron contactos en esta consolidación.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 align-top">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          c.origen.includes("Cliente +") || c.origen === "Cliente Registrado"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        {c.origen.includes("Cliente") ? <Users size={12} /> : <Mail size={12} />}
                        {c.origen}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-gray-900 text-[15px] mb-0.5">{c.nombre || "—"}</div>
                      <a href={`mailto:${c.email}`} className="text-brand-red hover:underline font-medium flex items-center gap-1.5">
                        <Mail size={12} /> {c.email}
                      </a>
                      {c.telefono && (
                        <div className="text-gray-500 text-xs mt-1.5 flex items-center gap-1.5">
                           {c.telefono}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-semibold text-gray-800">{c.empresa || "—"}</div>
                      <div className="text-gray-500 text-xs mt-1">{c.sector || ""}</div>
                    </td>
                    <td className="px-6 py-4 align-top text-xs text-gray-600">
                      {(c.presupuesto || c.volumen) ? (
                        <div className="space-y-1">
                          {c.presupuesto && <div><span className="font-semibold text-gray-800">Presupuesto:</span> {c.presupuesto}</div>}
                          {c.volumen && <div><span className="font-semibold text-gray-800">Volumen:</span> {c.volumen}</div>}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Sin datos de quiz</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-gray-500 font-medium">
                      {c.fecha ? new Date(c.fecha).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
