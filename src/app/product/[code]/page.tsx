import { notFound } from "next/navigation";
import { getProductDetail, getProductList, type CatalogProductResponse } from "@/lib/catalog-api";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";
import { ProductCard } from "@/components/catalog/ProductCard";

interface ProductPageProps {
  params: { code: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductDetail(params.code);
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
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
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
    </div>
  );
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProductDetail(params.code);
  if (!product) return { title: "Producto no encontrado" };

  return {
    title: `${product.name} — Universo Merchan`,
    description: product.shortDescription,
    openGraph: {
      title: `${product.name} — Personalízalo con tu marca`,
      description: product.shortDescription,
      images: product.mainImage ? [product.mainImage] : undefined,
    },
  };
}
