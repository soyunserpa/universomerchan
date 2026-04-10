"use client";

import { useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Mail, RefreshCw, Search, Save, Check, ChevronLeft, ChevronRight, Eye } from "lucide-react";

// ── Default email templates (used as fallback if DB has none) ──
const DEFAULT_TEMPLATES: Record<string, { label: string; audience: string; subject: string; body: string }> = {
    email_tpl_welcome: {
        label: "Bienvenida",
        audience: "Cliente",
        subject: "¡Bienvenido/a a Universo Merchan! 🎁",
        body: "¡Hola {{firstName}}!\n\nBienvenido/a a Universo Merchan. Explora más de 2.000 productos personalizables.",
    },
    email_tpl_order_confirmation: {
        label: "Confirmación de pedido",
        audience: "Cliente",
        subject: "Pedido confirmado: {{orderNumber}} ✓",
        body: "Hola {{firstName}}, hemos recibido tu pedido {{orderNumber}}.\n\nRevisaremos tu pedido y te enviaremos el boceto para tu aprobación.",
    },
    email_tpl_proof_ready: {
        label: "Boceto listo",
        audience: "Cliente",
        subject: "Boceto listo: {{orderNumber}} 👁️",
        body: "Hola {{firstName}}, el boceto de {{productName}} (pedido {{orderNumber}}) está listo para tu revisión.\n\nAcción requerida: Revisa y aprueba desde tu panel.",
    },
    email_tpl_proof_reminder: {
        label: "Recordatorio de boceto",
        audience: "Cliente",
        subject: "Recordatorio: Boceto pendiente {{orderNumber}} ⏱️",
        body: "Hola {{firstName}}, te recordamos que tienes pendiente de revisar el boceto de {{productName}} (pedido {{orderNumber}}). Han pasado 48 horas y necesitamos tu aprobación para enviar a producción.",
    },
    email_tpl_proof_approved: {
        label: "Boceto aprobado",
        audience: "Cliente",
        subject: "Boceto aprobado — En producción: {{orderNumber}} 🏭",
        body: "Hola {{firstName}}, el pedido {{orderNumber}} ya está en producción. Te avisaremos cuando se envíe (5-8 días).",
    },
    email_tpl_order_shipped: {
        label: "Pedido enviado",
        audience: "Cliente",
        subject: "¡Tu pedido va en camino! {{orderNumber}} 🚚",
        body: "Hola {{firstName}}, tu pedido {{orderNumber}} va en camino.\n\nTransportista: {{forwarder}}\nSeguimiento: {{trackingNumber}}",
    },
    email_tpl_order_delivered: {
        label: "Pedido entregado",
        audience: "Cliente",
        subject: "Pedido entregado: {{orderNumber}} ✅",
        body: "Hola {{firstName}}, tu pedido {{orderNumber}} ha sido entregado. ¡Esperamos que lo disfrutes!",
    },
    email_tpl_cart_abandoned: {
        label: "Carrito abandonado",
        audience: "Cliente",
        subject: "Tienes productos esperándote 🎁",
        body: "Hola {{firstName}}, dejaste productos en tu carrito. ¡No te los pierdas!\n\nTotal: {{totalPrice}}",
    },
    email_tpl_quote: {
        label: "Presupuesto",
        audience: "Cliente",
        subject: "Presupuesto {{quoteNumber}} — {{totalPrice}}",
        body: "Hola {{firstName}}, aquí tienes tu presupuesto {{quoteNumber}} por un total de {{totalPrice}}.\n\nVálido hasta {{expiresDate}}.",
    },
    email_tpl_admin_new_order: {
        label: "Nuevo pedido (Admin)",
        audience: "Admin",
        subject: "🆕 Nuevo pedido: {{orderNumber}} — {{totalPrice}}",
        body: "Nuevo pedido recibido.\n\nPedido: {{orderNumber}}\nCliente: {{clientName}} ({{clientEmail}})\nTotal: {{totalPrice}}",
    },
    email_tpl_admin_new_user: {
        label: "Nuevo usuario (Admin)",
        audience: "Admin",
        subject: "👤 Nuevo usuario: {{name}}",
        body: "Nuevo registro en la plataforma.\n\nNombre: {{name}}\nEmail: {{email}}\nEmpresa: {{company}}",
    },
    email_tpl_admin_proof_rejected: {
        label: "Boceto rechazado (Admin)",
        audience: "Admin",
        subject: "⚠️ Proof rechazado: {{orderNumber}}",
        body: "Un cliente ha rechazado un boceto.\n\nPedido: {{orderNumber}}\nCliente: {{clientName}}\nProducto: {{productName}}\nMotivo: {{reason}}",
    },
};

// ── Email type labels ──
const EMAIL_TYPE_LABELS: Record<string, string> = {
    welcome: "Bienvenida",
    order_confirmation: "Confirmación pedido",
    proof_ready: "Boceto listo",
    proof_reminder: "Recordatorio boceto",
    proof_approved: "Boceto aprobado",
    order_shipped: "Pedido enviado",
    order_delivered: "Pedido entregado",
    cart_abandoned: "Carrito abandonado",
    quote_generated: "Presupuesto",
    admin_new_order: "Nuevo pedido (admin)",
    admin_new_user: "Nuevo usuario (admin)",
    admin_proof_rejected: "Boceto rechazado (admin)",
    admin_order_error: "Error pedido (admin)",
    admin_order_completed: "Pedido completado (admin)",
};

export default function AdminEmailsPage() {
    const { authHeaders } = useAdminAuth();
    const [activeTab, setActiveTab] = useState<"logs" | "templates">("logs");

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-brand-red/10 p-2.5 rounded-xl">
                    <Mail className="text-brand-red" size={22} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Gestor de Emails</h1>
                    <p className="text-sm text-gray-500">Historial de envíos y plantillas editables</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
                <button
                    onClick={() => setActiveTab("logs")}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "logs" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    📋 Historial de envíos
                </button>
                <button
                    onClick={() => setActiveTab("templates")}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === "templates" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    ✏️ Plantillas de email
                </button>
            </div>

            {activeTab === "logs" ? <EmailLogs authHeaders={authHeaders} /> : <EmailTemplates authHeaders={authHeaders} />}
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// TAB 1: EMAIL LOGS
// ════════════════════════════════════════════════════════════

function EmailLogs({ authHeaders }: { authHeaders: () => Record<string, string> }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterType, setFilterType] = useState("");

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: "30" });
            if (filterType) params.set("type", filterType);
            const res = await fetch(`/api/admin/emails?${params}`, { headers: authHeaders() });
            const data = await res.json();
            setLogs(data.logs || []);
            setTotalPages(data.totalPages || 1);
            setTotal(data.total || 0);
        } catch { }
        setLoading(false);
    }, [page, filterType, authHeaders]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Filters */}
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-3">
                    <select
                        value={filterType}
                        onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                    >
                        <option value="">Todos los tipos</option>
                        {Object.entries(EMAIL_TYPE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                    <span className="text-xs text-gray-400">{total} emails enviados</span>
                </div>
                <button onClick={fetchLogs} className="text-gray-400 hover:text-gray-600 p-2" title="Refrescar">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left">
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Fecha</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Destinatario</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Tipo</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Asunto</th>
                            <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400"><RefreshCw className="animate-spin mx-auto mb-2" size={20} />Cargando...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400">No hay emails registrados todavía</td></tr>
                        ) : (
                            logs.map((log: any, i: number) => (
                                <tr key={log.id || i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">
                                        {new Date(log.sent_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                                        <span className="text-gray-400 ml-1 text-xs">
                                            {new Date(log.sent_at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-block w-2 h-2 rounded-full ${log.recipient_type === "admin" ? "bg-purple-500" : "bg-green-500"}`} />
                                            <span className="text-gray-700 truncate max-w-[200px]">{log.recipient_email}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-lg">
                                            {EMAIL_TYPE_LABELS[log.email_type] || log.email_type}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-600 truncate max-w-[300px]">{log.subject || "—"}</td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${log.delivery_status === "sent" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"
                                            }`}>
                                            {log.delivery_status === "sent" ? <Check size={12} /> : null}
                                            {log.delivery_status || "sent"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm">
                    <span className="text-gray-400">Página {page} de {totalPages}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ════════════════════════════════════════════════════════════
// TAB 2: EMAIL TEMPLATES
// ════════════════════════════════════════════════════════════

function EmailTemplates({ authHeaders }: { authHeaders: () => Record<string, string> }) {
    const [templates, setTemplates] = useState<Record<string, { subject: string; body: string }>>({});
    const [selectedKey, setSelectedKey] = useState<string | null>(null);
    const [editSubject, setEditSubject] = useState("");
    const [editBody, setEditBody] = useState("");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load saved templates from DB, merge with defaults
    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/admin/emails/templates", { headers: authHeaders() });
                const data = await res.json();

                // Start with defaults
                const merged: Record<string, { subject: string; body: string }> = {};
                for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
                    merged[key] = { subject: tpl.subject, body: tpl.body };
                }

                // Override with DB values
                for (const row of data.templates || []) {
                    try {
                        const parsed = JSON.parse(row.value);
                        merged[row.key] = { subject: parsed.subject || "", body: parsed.body || "" };
                    } catch { }
                }

                setTemplates(merged);
            } catch { }
            setLoading(false);
        })();
    }, [authHeaders]);

    const selectTemplate = (key: string) => {
        setSelectedKey(key);
        setEditSubject(templates[key]?.subject || "");
        setEditBody(templates[key]?.body || "");
        setSaved(false);
    };

    const saveTemplate = async () => {
        if (!selectedKey) return;
        setSaving(true);
        try {
            await fetch("/api/admin/emails/templates", {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({ key: selectedKey, value: JSON.stringify({ subject: editSubject, body: editBody }) }),
            });
            setTemplates(prev => ({ ...prev, [selectedKey]: { subject: editSubject, body: editBody } }));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { }
        setSaving(false);
    };

    if (loading) {
        return <div className="text-center py-12 text-gray-400"><RefreshCw className="animate-spin mx-auto mb-2" size={20} />Cargando plantillas...</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Template List */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">Plantillas</h3>
                    <p className="text-xs text-gray-400 mt-1">Selecciona una para editarla</p>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                    {Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => (
                        <button
                            key={key}
                            onClick={() => selectTemplate(key)}
                            className={`w-full text-left px-5 py-3.5 transition-colors ${selectedKey === key ? "bg-brand-red/5 border-l-4 border-brand-red" : "hover:bg-gray-50 border-l-4 border-transparent"}`}
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-800">{tpl.label}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tpl.audience === "Admin" ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                                    {tpl.audience}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{templates[key]?.subject || tpl.subject}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Template Editor */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {!selectedKey ? (
                    <div className="flex items-center justify-center h-96 text-gray-400">
                        <div className="text-center">
                            <Mail size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="font-medium">Selecciona una plantilla</p>
                            <p className="text-xs mt-1">para ver y editar su contenido</p>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-gray-900">{DEFAULT_TEMPLATES[selectedKey]?.label}</h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Variables disponibles: <code className="bg-gray-100 px-1 py-0.5 rounded text-[10px]">{"{{firstName}}, {{orderNumber}}, {{totalPrice}}, ..."}</code>
                                </p>
                            </div>
                            <button
                                onClick={saveTemplate}
                                disabled={saving}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${saved ? "bg-green-500 text-white" : "bg-brand-red text-white hover:bg-brand-red-dark"
                                    } disabled:opacity-50`}
                            >
                                {saved ? <><Check size={16} /> Guardado</> : saving ? <><RefreshCw size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar cambios</>}
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto del email</label>
                                <input
                                    type="text"
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido del email (texto)</label>
                                <textarea
                                    value={editBody}
                                    onChange={(e) => setEditBody(e.target.value)}
                                    rows={12}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono leading-relaxed focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red outline-none transition-all resize-none"
                                />
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5"><Eye size={14} /> Vista previa del asunto:</p>
                                <p className="text-sm text-gray-800 font-medium">{editSubject.replace(/\{\{(\w+)\}\}/g, (_, v) => `[${v}]`)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
