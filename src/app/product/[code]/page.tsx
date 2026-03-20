import { notFound } from "next/navigation";
import { getProductDetail } from "@/lib/catalog-api";
import { ProductConfigurator } from "@/components/product/ProductConfigurator";

interface ProductPageProps {
  params: { code: string };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductDetail(params.code);
  if (!product) return notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
