"use client";

import { useState, useEffect } from "react";
import { FolderOpen, Image as ImageIcon, Copy, ExternalLink, Calendar, HardDrive, LayoutTemplate } from "lucide-react";
import { useAdminAuth } from "@/components/admin/AdminLayout";

type MediaFile = {
  name: string;
  url: string;
  size: number;
  createdAt: string;
};

export default function MediaManagerPage() {
  const [activeTab, setActiveTab] = useState<"blog-portadas" | "artworks" | "mockups">("artworks");
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { authHeaders } = useAdminAuth();

  const fetchMedia = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media?category=${category}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setFiles(data.files || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia(activeTab);
  }, [activeTab]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("¡URL copiada al portapapeles!");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900 flex items-center gap-2">
            <FolderOpen className="text-brand-red" /> Gestor de Medios
          </h1>
          <p className="text-gray-500 text-sm mt-1">Explora los logotipos adjuntos de los clientes y las imágenes del blog.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "artworks", label: "Logos de Clientes (Sólidos)" },
          { id: "mockups", label: "Mockups Generados" },
          { id: "blog-portadas", label: "Portadas de Blog" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === tab.id
                ? "bg-white text-brand-red border-brand-red shadow-sm"
                : "text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <ImageIcon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">Escaneando servidor...</div>
        ) : files.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <LayoutTemplate className="mx-auto text-gray-300 mb-3" size={40} />
            <p className="text-gray-500 font-medium">Esta carpeta está vacía</p>
            <p className="text-sm text-gray-400">Aún no hay archivos subidos en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file, idx) => (
              <div key={idx} className="group flex flex-col border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center p-4">
                  <img 
                    src={file.url} 
                    alt={file.name} 
                    className="max-w-full max-h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400?text=Format+Not+Supported";
                    }}
                  />
                  
                  {/* Overlay Hooks */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a href={file.url} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:text-brand-red hover:scale-110 transition-all shadow-lg" title="Abrir en original">
                       <ExternalLink size={18} />
                    </a>
                    <button onClick={() => copyToClipboard(file.url)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 hover:text-blue-600 hover:scale-110 transition-all shadow-lg" title="Copiar URL">
                       <Copy size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="p-3 bg-white border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-900 truncate" title={file.name}>{file.name}</p>
                  <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1"><HardDrive size={10} /> {formatSize(file.size)}</span>
                    <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
