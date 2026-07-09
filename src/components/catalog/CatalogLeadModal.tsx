"use client";

// ============================================================
// UNIVERSO MERCHAN — Imán de leads del catálogo
// ============================================================
// Captura email (+empresa) → guarda lead en CRM, envía email con
// el catálogo + cupón de primer pedido, y descarga el PDF.
// ============================================================

import { useState } from "react";
import { X, Download, CheckCircle2, Loader2, Gift } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CatalogLeadModal({ open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState("");

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setErrMsg("Introduce un email válido");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrMsg("");
    try {
      const res = await fetch("/api/catalog/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          companyName: company.trim() || null,
          referer: typeof window !== "undefined" ? window.location.href : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Error");
      setCoupon(data.coupon || null);
      setStatus("done");
      // Descarga del PDF automáticamente
      window.open("/api/catalog/pdf", "_blank");
    } catch (err: any) {
      setErrMsg("No se ha podido enviar. Inténtalo de nuevo.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button aria-label="Cerrar" onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 z-10">
          <X size={22} />
        </button>

        {status === "done" ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="font-display font-extrabold text-2xl mb-2">¡Catálogo en camino!</h3>
            <p className="text-gray-600 text-sm mb-5">
              Te lo hemos enviado a <strong>{email}</strong> y se está descargando en PDF.
            </p>
            {coupon && (
              <div className="bg-red-50 border border-brand-red/30 rounded-xl p-4 mb-5">
                <p className="text-xs text-gray-600 mb-1 flex items-center justify-center gap-1">
                  <Gift size={14} className="text-brand-red" /> Tu descuento de primer pedido
                </p>
                <p className="font-display font-extrabold text-2xl text-brand-red tracking-wider">{coupon}</p>
                <p className="text-[11px] text-gray-500 mt-1">Aplícalo al finalizar tu compra.</p>
              </div>
            )}
            <a
              href="/api/catalog/pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-brand-red text-white font-bold px-6 py-3 rounded-full hover:bg-red-700 transition text-sm"
            >
              <Download size={16} /> Descargar de nuevo
            </a>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-br from-brand-red to-red-800 text-white p-6 text-center">
              <Gift className="w-10 h-10 mx-auto mb-2" />
              <h3 className="font-display font-extrabold text-2xl leading-tight">Descarga el catálogo + 10% de regalo</h3>
              <p className="text-white/80 text-sm mt-1">Te enviamos el catálogo en PDF y un cupón del 10% para tu primer pedido.</p>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm focus:border-brand-red outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Empresa (opcional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Nombre de tu empresa"
                  className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm focus:border-brand-red outline-none"
                />
              </div>
              {status === "error" && <p className="text-sm text-red-600">{errMsg}</p>}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full inline-flex items-center justify-center gap-2 bg-brand-red text-white font-bold px-6 py-3 rounded-full hover:bg-red-700 transition disabled:opacity-60"
              >
                {status === "loading" ? <><Loader2 size={18} className="animate-spin" /> Enviando…</> : <><Download size={18} /> Quiero el catálogo</>}
              </button>
              <p className="text-[11px] text-gray-400 text-center">
                Al continuar aceptas recibir el catálogo y comunicaciones de Universo Merchan. Puedes darte de baja cuando quieras.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
