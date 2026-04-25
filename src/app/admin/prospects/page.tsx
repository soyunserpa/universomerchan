"use client";

import { useState } from "react";
import { Sparkles, Send, Mail, Building, Briefcase, FileText, CheckCircle2 } from "lucide-react";

export default function ProspectsPage() {
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<{ subject: string; htmlBody: string } | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName) return;
    
    setIsLoading(true);
    setDraft(null);
    setSendSuccess(false);

    try {
      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, industry, notes }),
      });
      const data = await res.json();
      if (data.success && data.emailDraft) {
        setDraft(data.emailDraft);
      } else {
        alert("Error de IA: " + (data.error || "Desconocido"));
      }
    } catch (err: any) {
      alert("Fallo en la conexión: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!draft || !targetEmail) return;
    setIsSending(true);

    try {
      const res = await fetch("/api/admin/prospects/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEmail, subject: draft.subject, htmlBody: draft.htmlBody }),
      });
      const data = await res.json();
      if (data.success) {
        setSendSuccess(true);
      } else {
        alert("Fallo al enviar correo: " + data.error);
      }
    } catch (err: any) {
      alert("Error en el envío: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Sparkles className="text-brand-red" size={24} />
          Central de Prospección B2B Asistida por IA
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Usa nuestro agente "Lobo de Wall Street" para analizar a una empresa objetivo y generar automáticamente un mail frío ultra-persuasivo. 
          Los correos salen remitidos 100% de forma nativa por Universo Merchan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* PARTE IZQUIERDA: INPUTS */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Building size={14} className="text-gray-400" />
                Nombre de la Empresa Destino <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Ej: Glovo" 
                required
                className="w-full text-sm border-gray-200 rounded-lg p-2.5 focus:ring-brand-red focus:border-brand-red outline-none border"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <Briefcase size={14} className="text-gray-400" />
                ¿A qué sector se dedican?
              </label>
              <input 
                type="text" 
                value={industry}
                onChange={e => setIndustry(e.target.value)}
                placeholder="Ej: Reparto a domicilio / Foodtech" 
                className="w-full text-sm border-gray-200 rounded-lg p-2.5 focus:ring-brand-red focus:border-brand-red outline-none border"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1.5">
                <FileText size={14} className="text-gray-400" />
                Notas Estratégicas para la IA (Tú diriges la orquesta)
              </label>
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Escribe el ángulo de tu ataque. Ej: Acaban de levantar 50M de ronda, quiero ofrecerles botellas térmicas premium para sus empleados."
                className="w-full text-sm border-gray-200 rounded-lg p-2.5 focus:ring-brand-red focus:border-brand-red outline-none border resize-none"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isLoading || !companyName}
                className="w-full bg-black text-white hover:bg-gray-900 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <><span className="animate-spin text-xl">⏳</span> Pensando...</>
                ) : (
                  <><Sparkles size={16} /> Generar Correo Vendedor (IA)</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* PARTE DERECHA: RESULTADO Y ENVÍO */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
          {!draft && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <Mail size={48} className="mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-600">Rellena los datos a la izquierda</p>
              <p className="text-xs mt-1">La IA preparará tu propuesta lista para enviar al cliente.</p>
            </div>
          )}

          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 animate-pulse">
              <div className="w-12 h-12 bg-gray-100 rounded-full mb-3" />
              <div className="w-3/4 h-2.5 bg-gray-100 rounded-full mb-2" />
              <div className="w-1/2 h-2 bg-gray-100 rounded-full" />
            </div>
          )}

          {draft && !isLoading && (
            <div className="flex-1 flex flex-col animate-in fade-in zoom-in duration-300">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Asunto Generado</label>
                <input 
                  type="text" 
                  value={draft.subject}
                  onChange={(e) => setDraft({...draft, subject: e.target.value})}
                  className="w-full font-semibold text-sm bg-transparent outline-none text-gray-900 border-b border-transparent focus:border-brand-red pb-1 transition-all" 
                />
              </div>

              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4 flex flex-col min-h-[250px]">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1 flex justify-between">
                  <span>Cuerpo del correo (HTML)</span>
                  <span className="text-brand-red">Editable</span>
                </label>
                <textarea 
                  value={draft.htmlBody}
                  onChange={(e) => setDraft({...draft, htmlBody: e.target.value})}
                  className="w-full flex-1 text-sm bg-transparent outline-none text-gray-800 resize-none font-mono" 
                />
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1 mb-2">
                  <Mail size={12} /> Preparar el Disparo
                </label>
                <input 
                  type="email" 
                  value={targetEmail}
                  onChange={e => setTargetEmail(e.target.value)}
                  placeholder="Email directo del prospecto (ej: pablo@empresa.com)" 
                  className="w-full text-sm border-amber-200 bg-white rounded flex-1 p-2 outline-none focus:ring-1 focus:ring-amber-500 text-amber-900 placeholder:text-amber-300"
                />
              </div>

              {sendSuccess ? (
                <div className="w-full bg-green-50 text-green-700 py-3 rounded-xl border border-green-200 font-semibold flex flex-col items-center justify-center gap-1">
                  <div className="flex items-center gap-2"><CheckCircle2 size={18} /> ¡Disparado con éxito!</div>
                  <span className="text-[10px] font-normal">Revisa la bandeja de entrada para verificar.</span>
                </div>
              ) : (
                <button 
                  onClick={handleSend}
                  disabled={isSending || !targetEmail || !targetEmail.includes('@')}
                  className="w-full bg-brand-red text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <><span className="animate-spin text-xl">⏳</span> Enviando misteriosamente...</>
                  ) : (
                    <><Send size={16} /> Enviar Propuesta a {targetEmail || "este prospecto"}</>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
