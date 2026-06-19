import { getPostBySlug } from "@/lib/cms-content";
import { notFound } from "next/navigation";
import { Clock, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Metadata } from "next";
import { ShareButton } from "@/components/blog/ShareButton";

export async function generateMetadata({ params }: { params: { slug: string, locale: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug, params.locale);
  
  if (!post) {
    return { title: 'Post no encontrado | Universo Merchan' };
  }

  // Optimize Title (50-60 chars)
  let optimizedTitle = `${post.metaTitle || post.title} | Universo Merchan`;
  if (optimizedTitle.length > 65) {
    optimizedTitle = post.metaTitle || post.title;
  }

  // Optimize Description (Target: 120-155 chars)
  let optimizedDesc = post.metaDescription || post.excerpt || "";
  // Strip HTML if any
  optimizedDesc = optimizedDesc.replace(/<[^>]*>?/gm, '').trim();
  
  if (optimizedDesc.length > 155) {
    optimizedDesc = optimizedDesc.substring(0, 152) + '...';
  }

  return {
    title: optimizedTitle,
    description: optimizedDesc,
    alternates: {
      canonical: `/blog/${post.slug}`
    },
    openGraph: {
      title: optimizedTitle,
      description: optimizedDesc,
      images: post.featuredImage ? [{ url: post.featuredImage }] : [],
      type: "article",
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string, locale: string } }) {
  const post = await getPostBySlug(params.slug, params.locale);

  if (!post) {
    notFound();
  }

  // Calculate estimated reading time assuming ~200 words per minute
  const wordCount = post.body ? post.body.replace(/<[^>]*>?/gm, '').split(/\s+/).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Pre-process body for TOC
  const toc: { id: string, text: string }[] = [];
  
  let processedBody = post.body.includes('<p>') || post.body.includes('<h') || post.body.includes('<br')
    ? post.body 
    : post.body.split(/\n+/).filter(Boolean).map(text => `<p>${text}</p>`).join('');

  processedBody = processedBody.replace(/<h2.*?>(.*?)<\/h2>/gi, (match, content) => {
    const rawText = content.replace(/<[^>]+>/g, ''); // strip any inner HTML tags
    const id = rawText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    toc.push({ id, text: rawText });
    return `<h2 id="${id}">${content}</h2>`;
  });

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
              <p className="text-sm font-bold text-gray-900">{post.authorName?.replace(/ AI/gi, "") || "Universo Merchan"}</p>
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
        
        {/* Table of Contents */}
        {toc.length > 0 && (
          <div className="mb-10 bg-gray-50 p-6 rounded-xl border border-gray-100">
            <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Índice de contenidos</h3>
            <ul className="space-y-2">
              {toc.map((item, index) => (
                <li key={index}>
                  <a href={`#${item.id}`} className="text-brand-red hover:underline decoration-1 underline-offset-4">
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div 
          className="prose prose-lg md:prose-xl prose-red max-w-none prose-headings:font-display prose-headings:font-bold prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-brand-red prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-sm"
          dangerouslySetInnerHTML={{ __html: processedBody }}
        />
        
        {/* Author E-E-A-T Box */}
        <div className="mt-16 pt-8 pb-8 border-t border-gray-100 flex gap-6 items-start">
          <div className="w-16 h-16 rounded-full bg-brand-red text-white flex-shrink-0 flex items-center justify-center font-bold font-display text-2xl">
            UM
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Escrito por Universo Merchan</h3>
            <p className="text-gray-600 leading-relaxed text-sm">
              Especialistas con más de 15 años de experiencia en la personalización y distribución de regalos corporativos y merchandising publicitario. Ayudamos a las empresas de España a potenciar su marca con estrategias de impacto visual.
            </p>
          </div>
        </div>
        
        {/* Footer / Share actions */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center text-gray-500">
          <p className="text-sm font-semibold">¿Te ha resultado útil?</p>
          <ShareButton title={post.title} />
        </div>
      </div>

      {/* JSON-LD Schema for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://universomerchan.com/blog/${post.slug}`
            },
            headline: post.title,
            description: post.metaDescription || post.excerpt,
            url: `https://universomerchan.com/blog/${post.slug}`,
            image: post.featuredImage ? [post.featuredImage] : undefined,
            datePublished: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
            dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : (post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined),
            author: {
              "@type": "Organization",
              name: "Universo Merchan",
              url: "https://universomerchan.com"
            },
            publisher: {
              "@type": "Organization",
              name: "Universo Merchan",
              logo: {
                "@type": "ImageObject",
                url: "https://universomerchan.com/images/logo.png"
              }
            }
          })
        }}
      />
    </article>
  );
}
