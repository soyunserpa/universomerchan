import { Activity, ExternalLink, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Clarity Mapas de Calor | Admin",
};

export default function AdminClarityPage() {
  const clarityUrl = "https://clarity.microsoft.com/projects/view/s21obhozfe/dashboard";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
            <Activity className="text-brand-red" />
            Vigilancia Inteligente (Clarity)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Analiza qué hacen tus usuarios, dónde hacen clic y dónde se atascan.
          </p>
        </div>
        
        <Link 
          href={clarityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-brand-red text-white py-2 px-4 rounded-lg hover:bg-red-700 transition font-medium text-sm shadow-sm"
        >
          <ExternalLink size={16} />
          Abrir en Pantalla Completa
        </Link>
      </div>

      {/* Warning Box about Microsoft Security framing */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-amber-800">
        <AlertTriangle className="shrink-0 mt-0.5" size={18} />
        <div className="text-sm">
          <p className="font-semibold mb-1">Nota de Seguridad de Microsoft</p>
          <p>
            Por privacidad, Microsoft a veces bloquea la visualización dentro de otras webs si no has iniciado sesión 
            previamente en tu navegador. Si ves una caja gris o te pide Iniciar Sesión aquí abajo, te recomendamos usar el botón 
            rojo de arriba para abrirlo en su web oficial.
          </p>
        </div>
      </div>

      <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: "calc(100vh - 280px)", minHeight: "600px" }}>
        <iframe 
          src={clarityUrl}
          className="w-full h-full border-0 rounded-lg opacity-90 hover:opacity-100 transition-opacity"
          title="Microsoft Clarity Dashboard"
          loading="lazy"
          allowFullScreen
        />
      </div>
    </div>
  );
}
