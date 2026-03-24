"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Eye, EyeOff, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/AdminLayout";

type BlogPost = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  isPublished: boolean;
  publishedAt: string;
  authorName: string;
  updatedAt: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { authHeaders } = useAdminAuth();

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog", { headers: authHeaders() });
      const data = await res.json();
      if (data && data.posts) {
        setPosts(Array.isArray(data.posts) ? data.posts : []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar este artículo permanentemente?")) return;
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { 
        method: "DELETE",
        headers: authHeaders()
      });
      if (res.ok) fetchPosts();
    } catch (error) {
      alert("Error al eliminar el artículo");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Blog \u0026 Contenidos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona los artículos de tu tienda para mejorar el SEO.</p>
        </div>
        <Link href="/admin/blog/new" className="bg-brand-red text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold hover:bg-brand-red-dark transition-colors shadow-sm">
          <Plus size={16} /> Crear artículo
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
            <tr>
              <th className="px-6 py-4">Artículo</th>
              <th className="px-6 py-4">Autor</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Última Modificación</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Cargando artículos...</td></tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <LayoutTemplate className="mx-auto text-gray-300 mb-3" size={40} />
                  <p className="text-gray-500 font-medium">Aún no has escrito ningún artículo</p>
                  <p className="text-sm text-gray-400">Atrae clientes escribiendo sobre las tendencias en merchandising.</p>
                </td>
              </tr>
            ) : posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900 line-clamp-1">{post.title}</p>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">/{post.slug}</p>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-600">
                  {post.authorName || "Universo Merchan"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${post.isPublished ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                    {post.isPublished ? <Eye size={12} /> : <EyeOff size={12} />}
                    {post.isPublished ? 'Publicado' : 'Borrador'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(post.updatedAt).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button onClick={() => router.push(`/admin/blog/${post.id}`)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Edit2 size={18} /></button>
                  <button onClick={() => handleDelete(post.id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
