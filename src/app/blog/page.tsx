import Link from "next/link";
import { getPublishedPosts } from "@/lib/cms-content";
import { Clock, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Blog & Novedades | Universo Merchan",
  description: "Descubre las últimas tendencias en merchandising corporativo, regalos originales y técnicas de marcaje para impulsar tu marca.",
};

export default async function BlogPage() {
  const { posts } = await getPublishedPosts({ limit: 50 });

  return (
    <div className="bg-surface-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="bg-brand-red text-white py-16 md:py-24">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold font-display leading-tight">
              Inspiración para tu <span className="text-brand-orange">Marca</span>
            </h1>
            <p className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed">
              Tendencias, guías y casos de éxito sobre merchandising corporativo, serigrafía y regalos originales que conectan con tu audiencia.
            </p>
          </div>
        </div>
      </section>

      {/* Grid de Artículos */}
      <section className="container-custom -mt-8 relative z-10">
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center max-w-3xl mx-auto">
            <h3 className="text-xl font-bold font-display text-gray-900 mb-2">Aún no hay artículos</h3>
            <p className="text-gray-900">Estamos preparando contenido increíble para ti. ¡Vuelve pronto!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <Link 
                key={post.id} 
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Imagen (Aspect Ratio 16:9) */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  {post.featuredImage ? (
                    <img 
                      src={post.featuredImage} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <span className="font-display font-bold text-2xl tracking-tighter opacity-30">UM</span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">
                    <Clock size={14} />
                    <span>{new Date(post.publishedAt).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  
                  <h2 className="text-xl font-bold font-display text-gray-900 mb-3 group-hover:text-brand-red transition-colors line-clamp-2 leading-tight">
                    {post.title}
                  </h2>
                  
                  <p className="text-sm text-gray-900 leading-relaxed line-clamp-3 mb-6 flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center font-bold text-sm text-brand-red group-hover:text-brand-red-dark mt-auto">
                    Leer artículo <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
