import Link from "next/link";
import { getProductList, getCategories, getSubcategories } from "@/lib/catalog-api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Search } from "lucide-react";

interface CatalogPageProps {
  searchParams: { category?: string; subcategory?: string; search?: string; page?: string; sort?: string; green?: string; color?: string };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const category = searchParams.category || "Todos";
  const subcategory = searchParams.subcategory || "Todas";
  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1");
  const sort = (searchParams.sort || "name") as any;
  const greenOnly = searchParams.green === "true";
  const color = searchParams.color || "Todos";

  const [result, categories, subcategories] = await Promise.all([
    getProductList({
      category: category === "Todos" ? undefined : category,
      subcategory: subcategory === "Todas" ? undefined : subcategory,
      search, page, sort, greenOnly,
      color: color === "Todos" ? undefined : color,
      limit: 24,
    }),
    getCategories(),
    category !== "Todos" ? getSubcategories(category) : Promise.resolve([]),
  ]);

  const allCategories = [{ name: "Todos", slug: "todos", productCount: 0 }, ...categories];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-3xl mb-2">Catálogo</h1>
        {search && <p className="text-gray-400 text-sm">Resultados para &quot;{search}&quot;</p>}
      </div>

      {/* Search bar */}
      <div className="flex gap-4 items-center mb-5">
        {/* Search is always global — navigates to /catalog?search=X without category scope */}
        <form action="/catalog" method="GET" className="flex-1 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={17} />
          </div>
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Buscar productos, materiales, categorías..."
            className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-full text-sm font-body"
          />
        </form>
        <span className="text-sm text-gray-400 hidden sm:block">{result.total} productos</span>
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
        search={search}
      />

      {/* Product Grid */}
      {result.products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {result.products.map((product, i) => (
            <ProductCard key={product.masterCode} product={product} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg mb-2">No se encontraron productos</p>
          <p className="text-gray-300 text-sm mb-6">Prueba con otros filtros o términos de búsqueda</p>
          <Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full">
            Ver todos los productos
          </Link>
        </div>
      )}

      {/* Pagination */}
      {result.pages > 1 && (
        <div className="flex justify-center gap-2 mt-10">
          {Array.from({ length: Math.min(result.pages, 10) }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            if (category !== "Todos") params.set("category", category);
            if (subcategory !== "Todas") params.set("subcategory", subcategory);
            if (search) params.set("search", search);
            if (sort !== "name") params.set("sort", sort);
            if (color !== "Todos") params.set("color", color);
            params.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/catalog?${params.toString()}`}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-brand-red text-white"
                    : "bg-surface-100 text-gray-500 hover:bg-surface-200"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
