import { notFound } from "next/navigation";
import { getProductDetail, getProductList, type CatalogProductResponse } from "@/lib/catalog-api";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { ProductCard } from "@/components/catalog/ProductCard";

interface ProductPageProps {
  params: { code: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // El slug puede ser "MO9222-botella-de-aluminio". Extraemos solo el Master Code.
  const masterCode = params.code.split('-')[0].toUpperCase();
  const product = await getProductDetail(masterCode);
  if (!product) return notFound();

  // Fetch related products
  let relatedProducts: CatalogProductResponse[] = [];
  try {
    const relatedData = await getProductList({
      category: product.category,
      limit: 10,
    });
    
    // Exclude the current product and grab exactly 4 items
    relatedProducts = relatedData.products
      .filter((p) => p.masterCode !== product.masterCode)
      .slice(0, 4);
      
  } catch (e) {
    // Fail silently so the product page doesn't break if suggestions fail
    console.error("Failed to load related products", e);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 overflow-hidden">
      {/* JSON-LD Breadcrumb for Google */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Catálogo", item: "https://universomerchan.com/catalog" },
              { "@type": "ListItem", position: 2, name: product.category, item: `https://universomerchan.com/catalog?category=${encodeURIComponent(product.category)}` },
              { "@type": "ListItem", position: 3, name: product.name },
            ],
          }),
        }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-900 mb-6">
        <a href="/catalog" className="hover:text-gray-600 transition-colors">Catálogo</a>
        <span>›</span>
        <a href={`/catalog?category=${encodeURIComponent(product.category)}`} className="hover:text-gray-600 transition-colors">
          {product.category}
        </a>
        <span>›</span>
        <span className="text-gray-700 font-medium">{product.name}</span>
      </nav>

      {/* Configurator — client component handles all interactivity */}
      <ProductConfigurator product={product} />

      {/* ── RELATED PRODUCTS SECTION ──────────────────────── */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 border-t border-surface-200 pt-16 pb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-gray-900 mb-2">También te podría interesar</h2>
              <p className="text-gray-500 text-sm">Explora productos similares dentro de la familia <b>{product.category}</b></p>
            </div>
            <a href={`/catalog?category=${encodeURIComponent(product.category)}`} className="text-brand-red font-semibold text-sm bg-brand-red/10 px-4 py-2 rounded-lg hover:bg-brand-red/20 transition-colors">
              Ver más de esta categoría
            </a>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.masterCode} product={p as CatalogProductResponse} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD Schema for rich snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: product.variants?.filter(v => v.mainImage).map(v => v.mainImage) || [product.mainImage],
            description: product.shortDescription || product.longDescription,
            sku: product.masterCode,
            mpn: product.masterCode,
            material: product.material || undefined,
            category: product.category,
            brand: {
              "@type": "Brand",
              name: product.brand || "Universo Merchan",
            },
            ...(product.isGreen ? { additionalProperty: { "@type": "PropertyValue", name: "Sostenible", value: "Sí" } } : {}),
            offers: {
              "@type": "AggregateOffer",
              url: `https://universomerchan.com/product/${params.code.toLowerCase()}`,
              priceCurrency: "EUR",
              lowPrice: product.startingPriceRaw || 0,
              offerCount: product.variants?.length || 1,
              availability: product.totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: "Universo Merchan",
                url: "https://universomerchan.com",
              },
            },
            isRelatedTo: relatedProducts.slice(0, 3).map(rp => ({
              "@type": "Product",
              name: rp.name,
              url: `https://universomerchan.com/product/${rp.masterCode.toLowerCase()}`,
              image: rp.mainImage,
            })),
          }),
        }}
      />
    </div>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const masterCode = params.code.split('-')[0].toUpperCase();
  const product = await getProductDetail(masterCode);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} — Universo Merchan`,
    description: product.shortDescription,
    alternates: {
      canonical: `/product/${params.code.toLowerCase()}`
    },
    openGraph: {
      title: `${product.name} — Personalízalo con tu marca`,
      description: product.shortDescription,
      images: product.mainImage ? [product.mainImage] : undefined,
    },
  };
}
