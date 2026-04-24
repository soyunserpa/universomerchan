"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { RefreshCw, Users, Mail, Phone, Building, Briefcase, Handshake, CheckCircle2, ChevronRight, XCircle, Download, Trash2 } from "lucide-react";

type LeadStatus = "NEW" | "CONTACTED" | "PROPOSAL_SENT" | "WON" | "LOST";

interface Lead {
  id: number;
  email: string;
  phone: string | null;
  companyName: string | null;
  industry: string | null;
  budget: string | null;
  objective: string | null;
  volume: string | null;
  status: LeadStatus;
  adminNotes: string | null;
  createdAt: string;
}

const COLUMNS: { id: LeadStatus; label: string; bg: string; border: string; icon: any }[] = [
  { id: "NEW", label: "Nuevos Leads", bg: "bg-blue-50", border: "border-blue-200", icon: Users },
  { id: "CONTACTED", label: "Contactados", bg: "bg-purple-50", border: "border-purple-200", icon: Phone },
  { id: "PROPOSAL_SENT", label: "Presupuesto Enviado", bg: "bg-amber-50", border: "border-amber-200", icon: Briefcase },
  { id: "WON", label: "Cerrados (Ganados)", bg: "bg-green-50", border: "border-green-200", icon: CheckCircle2 },
  { id: "LOST", label: "Descartados", bg: "bg-red-50", border: "border-red-200", icon: XCircle },
];

export default function CRMDashboard() {
  const { authHeaders } = useAdminAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crm", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setLeads(data.leads || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: number, newStatus: LeadStatus) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

    try {
      const res = await fetch("/api/admin/crm", {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on error
        fetchLeads();
      }
    } catch (e) {
      console.error(e);
      fetchLeads();
    }
  };

  const deleteLead = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este lead permanentemente?")) return;
    try {
      const res = await fetch(`/api/admin/crm?id=${id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.filter(l => l.id !== id));
      } else {
        alert("Error al eliminar lead");
      }
    } catch (e) {
      console.error(e);
      alert("Error borrando el lead");
    }
  };

  const downloadCSV = () => {
    if (!leads.length) return alert("No hay leads para exportar");
    
    const headers = ["ID", "Fecha", "Empresa", "Email", "Teléfono", "Sector", "Presupuesto", "Volumen", "Objetivo", "Estado"];
    const rows = leads.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleDateString(),
      `"${l.companyName || ""}"`,
      `"${l.email || ""}"`,
      `"${l.phone || ""}"`,
      `"${l.industry || ""}"`,
      `"${l.budget || ""}"`,
      `"${l.volume || ""}"`,
      `"${l.objective || ""}"`,
      l.status
    ]);
    
    // Add BOM for correct Excel UTF-8 encoding
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_crm_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggingId(id);
    e.dataTransfer.setData("text/plain", id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, statusColumn: LeadStatus) => {
    e.preventDefault();
    if (!draggingId) return;
    
    const lead = leads.find(l => l.id === draggingId);
    if (lead && lead.status !== statusColumn) {
      updateLeadStatus(draggingId, statusColumn);
    }
    setDraggingId(null);
  };

  if (loading && leads.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-gray-300 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-gray-900">Pipeline de Ventas (CRM)</h1>
          <p className="text-sm text-gray-500 mt-1">Arrastra y suelta los leads capturados en el Visual Quiz.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="flex items-center gap-2 px-3 py-2 border border-surface-200 bg-white rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm shadow-sm">
            <Download size={16} /> <span className="hidden sm:inline">Exportar CSV</span>
          </button>
          <button onClick={fetchLeads} className="p-2 border border-surface-200 bg-white rounded-lg text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 items-start pt-2">
        {COLUMNS.map(col => {
          const columnLeads = leads.filter(l => l.status === col.id);
          
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex-shrink-0 w-[320px] flex flex-col max-h-[80vh] bg-white rounded-2xl border-2 ${col.border} overflow-hidden shadow-sm`}
            >
              <div className={`px-4 py-3 border-b ${col.border} ${col.bg} flex justify-between items-center sticky top-0`}>
                <div className="flex items-center gap-2">
                  <col.icon size={16} className="text-gray-700" />
                  <h3 className="font-bold text-gray-900 text-sm">{col.label}</h3>
                </div>
                <span className="bg-white text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200 shadow-sm">
                  {columnLeads.length}
                </span>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[150px] bg-gray-50/50">
                {columnLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-grab active:cursor-grabbing hover:border-gray-400 hover:shadow-md transition-all group relative"
                  >
                    {/* Drag indicator */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-3 ml-2">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900 text-[15px] truncate flex items-center gap-1.5 pr-2">
                            {lead.companyName || "Sin Empresa"}
                          </h4>
                          <button 
                            onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            title="Eliminar lead"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <a href={`mailto:${lead.email}`} className="text-xs text-brand-red truncate hover:underline flex items-center gap-1 mt-1 font-medium">
                          <Mail size={11} /> {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="text-xs text-gray-500 truncate hover:text-gray-800 flex items-center gap-1 mt-0.5">
                            <Phone size={11} /> {lead.phone}
                          </a>
                        )}
                        <a 
                          href={`https://eu.posthog.com/project/${process.env.NEXT_PUBLIC_POSTHOG_KEY || 'current'}/person/${lead.email}#recordings`}
                          target="_blank"
                          rel="noreferrer"
                          title="Ver grabaciones de sesión en PostHog"
                          className="bg-red-50 text-brand-red hover:bg-brand-red hover:text-white transition-colors px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 w-max mt-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                          VER VÍDEOS
                        </a>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 ml-2 mt-3 pt-3 border-t border-dashed border-gray-100">
                      <div className="flex items-start gap-2">
                        <Building size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-1">{lead.industry || "—"}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-1">Volumen: <strong className="font-semibold text-gray-800">{lead.volume || "—"}</strong></span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Briefcase size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-2">Obj: <strong className="font-semibold text-gray-800">{lead.objective || "—"}</strong></span>
                      </div>
                      {lead.budget && (
                        <div className="mt-2 bg-green-50 text-green-700 text-[11px] px-2 py-1 rounded font-semibold inline-block">
                          Presupuesto: {lead.budget}
                        </div>
                      )}
                    </div>
                    <div className="mt-3 ml-2 text-[10px] text-gray-400 text-right">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                
                {columnLeads.length === 0 && (
                  <div className="h-full flex items-center justify-center min-h-[100px] border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 font-medium bg-transparent">
                    Arrastra un lead aquí
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
