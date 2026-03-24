import { getPostBySlug } from "@/lib/cms-content";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  
  if (!post) {
    return { title: 'Post no encontrado | Universo Merchan' };
  }

  return {
    title: `${post.metaTitle || post.title} | Universo Merchan`,
    description: post.metaDescription || post.excerpt,
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt,
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // Calculate estimated reading time assuming ~200 words per minute
  const wordCount = post.body ? post.body.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <article className="min-h-screen bg-white pb-24">
      {/* Blog Header / Cover */}
      <header className="relative bg-surface-50 pt-16 pb-20 md:pt-24 md:pb-32 border-b border-gray-100 overflow-hidden">
        <div className="container-custom relative z-10 max-w-4xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-brand-red transition-colors mb-8">
            <ArrowLeft size={16} /> Volver al Blog
          </Link>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-500 mb-6">
            <div className="flex items-center gap-1.5 uppercase tracking-wider text-brand-red bg-red-50 px-3 py-1 rounded-full">
              Merchandising
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{readingTime} min de lectura</span>
            </div>
            <span>•</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' })}
            </time>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold font-display text-gray-900 leading-[1.15] tracking-tight mb-6">
            {post.title}
          </h1>
          
          {post.excerpt && (
            <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-3xl">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 mt-8 pt-8 border-t border-gray-200">
            <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center font-bold font-display text-lg">
              UM
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{post.authorName || "Universo Merchan"}</p>
              <p className="text-xs text-gray-500">Equipo Editorial</p>
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="container-custom max-w-4xl mx-auto -mt-12 md:-mt-24 relative z-20 mb-16">
          <div className="aspect-[21/9] w-full rounded-2xl overflow-hidden shadow-xl bg-gray-100 border-4 border-white">
            <img 
              src={post.featuredImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      {/* Article Content */}
      <div className={`container-custom max-w-4xl mx-auto ${!post.featuredImage ? 'mt-16' : ''}`}>
        <div 
          className="prose prose-lg md:prose-xl prose-red max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-sm"
          dangerouslySetInnerHTML={{ __html: post.body }}
        />
        
        {/* Footer / Share actions */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center text-gray-500">
          <p className="text-sm font-semibold">¿Te ha resultado útil?</p>
          <button className="flex items-center gap-2 text-sm font-semibold hover:text-brand-red transition-colors bg-surface-50 hover:bg-red-50 px-4 py-2 rounded-full">
            <Share2 size={16} /> Compartir Artículo
          </button>
        </div>
      </div>
    </article>
  );
}
