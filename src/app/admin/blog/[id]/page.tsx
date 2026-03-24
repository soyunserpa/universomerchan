"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Image as ImageIcon, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAdminAuth } from "@/components/admin/AdminLayout";

export default function AdminBlogEditor({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { authHeaders, logout } = useAdminAuth();
  const isNew = params.id === "new";
  
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    body: "",
    featuredImageUrl: "",
    metaTitle: "",
    metaDescription: "",
    isPublished: false,
  });

  useEffect(() => {
    if (!isNew) {
      fetchPost();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const res = await fetch(`/api/admin/blog/${params.id}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.post) {
        setFormData({
          title: data.post.title || "",
          slug: data.post.slug || "",
          excerpt: data.post.excerpt || "",
          body: data.post.body || "",
          featuredImageUrl: data.post.featuredImageUrl || "",
          metaTitle: data.post.metaTitle || "",
          metaDescription: data.post.metaDescription || "",
          isPublished: data.post.isPublished || false,
        });
      }
    } catch (e) {
      console.error(e);
      alert("Error al cargar el artículo");
    }
    setLoading(false);
  };

  const handleSave = async (publishStatus?: boolean) => {
    setSaving(true);
    
    const isPublished = publishStatus !== undefined ? publishStatus : formData.isPublished;
    
    try {
      const url = isNew ? "/api/admin/blog" : `/api/admin/blog/${params.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const payload = { ...formData, isPublished };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.success || data.post || data.id) {
        if (isNew) {
          router.push(`/admin/blog/${data.id || data.post?.id}`);
        } else {
          setFormData(prev => ({ ...prev, isPublished }));
          alert("Artículo guardado correctamente");
        }
      } else {
        alert(data.error || "Error al guardar");
      }
    } catch (e) {
      console.error(e);
      alert("Error de red al guardar");
    }
    
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formPayload = new FormData();
    formPayload.append("image", file);

    try {
      const res = await fetch("/api/admin/blog/upload", {
        method: "POST",
        headers: authHeaders(),
        body: formPayload,
      });
      
      let data;
      const textResponse = await res.text();
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`Fallo del Servidor HTTP ${res.status}: ${textResponse.substring(0, 150)}`);
      }
      
      if (data.success) {
        setFormData((prev) => ({ ...prev, featuredImageUrl: data.imageUrl }));
      } else {
        if (data.error?.toLowerCase().includes("token") || res.status === 401) {
          alert("Tu sesión ha caducado por seguridad. Por favor, vuelve a iniciar sesión.");
          logout();
          router.push("/admin/login");
        } else {
          alert(data.error || "Error al subir la imagen");
        }
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Error al subir la imagen");
    }
    setUploadingImage(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando editor...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog" className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-display text-gray-900">
              {isNew ? "Nuevo Artículo" : "Editar Artículo"}
            </h1>
            <p className="text-xs font-mono text-gray-400 mt-0.5">
              {isNew ? "Borrador sin guardar" : `Slug: /blog/${formData.slug}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleSave(false)} 
            disabled={saving}
            className="px-4 py-2 font-semibold text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Guardar Borrador
          </button>
          <button 
            onClick={() => handleSave(true)} 
            disabled={saving}
            className="px-4 py-2 font-semibold text-sm bg-brand-red text-white rounded-lg flex items-center gap-2 hover:bg-brand-red-dark transition-colors shadow-sm"
          >
            <Save size={16} />
            {saving ? "Guardando..." : (formData.isPublished ? "Actualizar Público" : "Publicar Ahora")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Editor Principal */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Título del artículo</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ej. Las 5 tendencias de Merchandising en 2026"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 font-display text-lg focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-1.5">
                <label className="block text-sm font-bold text-gray-700">Contenido (HTML permitido)</label>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  <Sparkles size={12} />
                  <span>Compatible con IA (Claude/Gemini)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Si usas ChatGPT, Claude o Gemini para redactar el post, pídeles que te devuelvan el texto directamente en formato <strong>HTML</strong> (con etiquetas &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, etc) y pégalo aquí.
              </p>
              <textarea 
                value={formData.body} 
                onChange={e => setFormData({...formData, body: e.target.value})}
                placeholder="<h2>Introducción</h2><p>Escribe aquí tu contenido...</p>"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 h-[450px] font-mono text-sm leading-relaxed focus:ring-2 focus:ring-brand-red focus:border-brand-red outline-none transition-all resize-y"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Configuración */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-5">
            <h3 className="font-bold text-gray-900 border-b pb-3">Metadatos </h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">URL Slug (Automático si vacío)</label>
              <input 
                type="text" 
                value={formData.slug} 
                onChange={e => setFormData({...formData, slug: e.target.value})}
                placeholder="ej: tendencias-merchandising"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Resumen corto (Para el catálogo)</label>
              <textarea 
                value={formData.excerpt} 
                onChange={e => setFormData({...formData, excerpt: e.target.value})}
                maxLength={250}
                placeholder="Aparecerá en la tarjeta de la página /blog..."
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-24 focus:ring-2 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Imagen de Portada</label>
              {formData.featuredImageUrl ? (
                <div className="mb-2 relative rounded-md overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                  <img src={formData.featuredImageUrl} alt="Portada" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="mb-2 bg-gray-50 aspect-video rounded-md border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  <ImageIcon size={24} />
                </div>
              )}
              
              <div className="flex flex-col gap-2">
                <input 
                  type="text" 
                  value={formData.featuredImageUrl} 
                  onChange={e => setFormData({...formData, featuredImageUrl: e.target.value})}
                  placeholder="URL de la imagen (o súbela debajo)"
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2"
                />
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm text-center font-semibold transition-colors ${uploadingImage ? 'bg-gray-100 text-gray-400' : 'bg-white text-brand-red hover:bg-red-50'}`}>
                    {uploadingImage ? "Subiendo..." : "Subir desde PC"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SEO Block */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
            <h3 className="font-bold text-gray-900 border-b pb-3">Optimización SEO</h3>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Meta Title (Google)</label>
              <input 
                type="text" 
                value={formData.metaTitle} 
                onChange={e => setFormData({...formData, metaTitle: e.target.value})}
                placeholder="Si está vacío usará el título"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Meta Description (Google)</label>
              <textarea 
                value={formData.metaDescription} 
                onChange={e => setFormData({...formData, metaDescription: e.target.value})}
                placeholder="Si está vacío usará el resumen corto"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm h-20 focus:ring-2 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
