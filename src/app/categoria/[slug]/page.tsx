import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductList, getCategories, getSubcategories } from "@/lib/catalog-api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Search } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const categories = await getCategories();
  const cat = categories.find(c => c.slug === params.slug);
  if (!cat) return { title: "Categoría no encontrada" };

  return {
    title: `${cat.name} Personalizados para Empresas | Universo Merchan`,
    description: `Catálogo premium de ${cat.name.toLowerCase()} para marketing B2B. Personaliza online con tu logo y recibe presupuestos instantáneos con descuentos por volumen. Envío rápido.`,
    alternates: {
      canonical: `/categoria/${params.slug}`
    }
  };
}

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { subcategory?: string; page?: string; sort?: string; green?: string; color?: string };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const categories = await getCategories();
  const currentCat = categories.find(c => c.slug === params.slug);
  
  if (!currentCat) {
    notFound();
  }

  const category = currentCat.name;
  const subcategory = searchParams.subcategory || "Todas";
  const page = parseInt(searchParams.page || "1");
  const sort = (searchParams.sort || "name") as any;
  const greenOnly = searchParams.green === "true";
  const color = searchParams.color || "Todos";

  const [result, subcategories] = await Promise.all([
    getProductList({
      category: category,
      subcategory: subcategory === "Todas" ? undefined : subcategory,
      page, sort, greenOnly,
      color: color === "Todos" ? undefined : color,
      limit: 24,
    }),
    getSubcategories(category)
  ]);

  const allCategories = [{ name: "Todos", slug: "todos", productCount: 0 }, ...categories];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header SEO */}
      <div className="mb-8 bg-brand-red text-white p-8 sm:p-12 rounded-3xl relative overflow-hidden shadow-lg animate-fade-in">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 max-w-3xl">
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight mb-4">{category} Personalizados</h1>
          <p className="text-white/90 text-lg leading-relaxed font-body font-medium">
            Impulsa el branding de tu empresa con nuestro catálogo de {category.toLowerCase()}. 
            Selecciona el modelo, sube tu logotipo y visualiza el resultado al instante. 
            Precios B2B automatizados con descuentos por volumen.
          </p>
        </div>
      </div>

      {/* Global Search Redirection */}
      <div className="flex gap-4 items-center mb-6">
        <form action="/catalog" method="GET" className="flex-1 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-red transition-colors">
            <Search size={18} />
          </div>
          <input
            type="text"
            name="search"
            placeholder="Buscar en todo el catálogo (ej: libretas sostenibles)..."
            className="w-full pl-11 pr-4 py-3 border-2 border-surface-200 rounded-full text-sm font-body shadow-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all"
          />
        </form>
        <span className="text-sm font-bold text-gray-900 hidden sm:block bg-surface-100 px-4 py-2 rounded-full">
          {result.total} {result.total === 1 ? "modelo" : "modelos"} de {category.toLowerCase()}
        </span>
      </div>

      {/* Filters */}
      <CatalogFilters
        categories={allCategories}
        subcategories={subcategories}
        currentCategory={category}
        currentSubcategory={subcategory}
        currentSort={sort}
        currentColor={color}
        greenOnly={greenOnly}
        search={""}
      />

      {/* Product Grid */}
      {result.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {result.products.map((product, i) => (
            <ProductCard key={product.masterCode} product={product} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-surface-50 rounded-3xl mt-8">
          <p className="text-gray-900 text-lg font-bold mb-2">No se encontraron productos</p>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">Prueba rebajando los filtros seleccionados para ver más resultados dentro de esta categoría.</p>
          <Link href={`/categoria/${params.slug}`} className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-brand-red-dark transition-colors">
            Limpiar filtros
          </Link>
        </div>
      )}

      {/* Pagination */}
      {result.pages > 1 && (
        <div className="flex justify-center gap-2 mt-12 pb-8">
          {Array.from({ length: Math.min(result.pages, 10) }, (_, i) => i + 1).map((p) => {
            const linkParams = new URLSearchParams();
            if (subcategory !== "Todas") linkParams.set("subcategory", subcategory);
            if (sort !== "name") linkParams.set("sort", sort);
            if (color !== "Todos") linkParams.set("color", color);
            linkParams.set("page", String(p));
            
            return (
              <Link
                key={p}
                href={`/categoria/${params.slug}?${linkParams.toString()}`}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all shadow-sm ${
                  p === page
                    ? "bg-brand-red text-white scale-110"
                    : "bg-white text-gray-900 border border-surface-200 hover:border-brand-red hover:text-brand-red"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}

      {/* SEO Footer Text Block */}
      <div className="mt-16 pt-12 border-t border-surface-200 max-w-4xl mx-auto text-center px-4">
        <h2 className="font-display font-bold text-2xl mb-4">¿Por qué elegir nuestros {category.toLowerCase()} para empresas?</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          La elección de material corporativo no debe tomarse a la ligera. En Universo Merchan nos especializamos en distribuir {category.toLowerCase()} diseñados para generar un impacto positivo en tus clientes, empleados y colaboradores. Nuestro compromiso con la calidad europea y la personalización B2B garantiza que el logotipo de tu marca lucirá impecable en cada objeto.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Ya sea que busques opciones ecológicas, materiales premium como el bambú o el corcho, o tecnología de serigrafía de alta duración, nuestra plataforma te permite visualizar tu diseño en 3D antes de comprar. <b>Genera tu presupuesto en PDF ahora mismo</b> y aprovecha nuestra red logística para recibir tu pedido en la península en un tiempo récord.
        </p>
      </div>
    </div>
  );
}
