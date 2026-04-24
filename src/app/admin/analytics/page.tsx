"use client";

import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Video, ExternalLink, PlayCircle, Settings, Rocket, User as UserIcon, Search } from "lucide-react";
import { useState } from "react";

export default function AnalyticsPage() {
  const { user } = useAdminAuth();
  const [emailQuery, setEmailQuery] = useState("");

  const posthogProjectUrl = "https://eu.posthog.com/project/current/replay";
  
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl font-display font-extrabold flex items-center gap-2">
            <Video className="text-brand-red" size={28} /> Grabaciones de Sesión
          </h1>
          <p className="text-gray-500 text-sm mt-1">Analítica de comportamiento (Session Replay) mediante PostHog</p>
        </div>
        <a 
          href="https://eu.posthog.com"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Settings size={16} /> Dashboard PostHog <ExternalLink size={14} />
        </a>
      </div>

      <div className="p-8 max-w-5xl mx-auto space-y-6">
        
        {/* Quick Search */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold font-display mb-4">Buscar Grabación por Email</h2>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="email"
                placeholder="Ej. jerry.zhanay@gmail.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-brand-red rounded-xl outline-none transition-all"
                value={emailQuery}
                onChange={(e) => setEmailQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && emailQuery) {
                    window.open(`https://eu.posthog.com/project/${process.env.NEXT_PUBLIC_POSTHOG_KEY || 'current'}/person/${emailQuery}#recordings`, "_blank");
                  }
                }}
              />
            </div>
            <button 
              disabled={!emailQuery}
              onClick={() => window.open(`https://eu.posthog.com/project/${process.env.NEXT_PUBLIC_POSTHOG_KEY || 'current'}/person/${emailQuery}#recordings`, "_blank")}
              className="bg-brand-red text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PlayCircle size={20} /> Ver Vídeos
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Al buscar un correo registrado, saltarás directamente a su historial de grabaciones de vídeo.</p>
        </div>

        {/* Info Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white text-left relative overflow-hidden">
            <Video className="absolute -right-6 -bottom-6 w-40 h-40 text-white/5" />
            <h3 className="font-display font-bold text-xl mb-2 flex items-center gap-2">
               ¿Qué es PostHog Session Replay?
            </h3>
            <p className="text-gray-300 text-sm mb-4 leading-relaxed">
              El motor ya está capturando en silencio todos los movimientos de ratón, clics y navegación de los usuarios a lo largo de Universo Merchan.
              Las contraseñas y tarjetas están censuradas automáticamente por privacidad.
            </p>
            <a 
              href={posthogProjectUrl} 
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 bg-brand-red px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-red-500 transition-colors"
            >
              <PlayCircle size={18} /> Ver Todas las Grabaciones Recientes
            </a>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative">
            <h3 className="font-display font-bold text-xl mb-2 text-gray-900 flex items-center gap-2">
               <Rocket className="text-yellow-500" /> Modo de Uso
            </h3>
            <ul className="space-y-4 mt-6">
              <li className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0 font-bold">1</div>
                <div>
                  <h4 className="font-bold text-sm">Leads con Error</h4>
                  <p className="text-sm text-gray-500 mt-1">Si detectas múltiples carritos abandonados repetidos, busca su email arriba para ver en vídeo exactamente dónde se atascó.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center shrink-0 font-bold">2</div>
                <div>
                  <h4 className="font-bold text-sm">Auditoría Visual</h4>
                  <p className="text-sm text-gray-500 mt-1">Observa la matriz general en PostHog para ver qué botones atraen más o dónde la gente se marcha (Drop-off Rate).</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
