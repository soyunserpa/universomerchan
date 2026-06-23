import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { alternatesFor, ogLocale, localeUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getProductList, getCategories, getSubcategories } from "@/lib/catalog-api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Search } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const categories = await getCategories();
  const cat = categories.find(c => c.slug === params.slug);
  if (!cat) return { title: "Categoría no encontrada | Universo Merchan" };

  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Seo" });
  // getCategories añade displayName localizado; usamos ese para título/desc traducidos.
  const categoryName = (cat as any).displayName || cat.name;
  const title = t("category_title", { category: categoryName });
  const description = t("category_description", { category: categoryName.toLowerCase() });

  return {
    title,
    description,
    // canonical auto-referente por idioma + hreflang de los 7 idiomas + x-default
    alternates: alternatesFor(locale, `/categoria/${params.slug}`),
    openGraph: {
      title,
      description,
      url: localeUrl(locale, `/categoria/${params.slug}`),
      type: "website",
      locale: ogLocale(locale),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

interface CategoryPageProps {
  params: { slug: string };
  searchParams: { subcategory?: string; page?: string; sort?: string; green?: string; color?: string };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const t = await getTranslations("Misc");
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
          <h1 className="font-display font-extrabold text-4xl sm:text-5xl tracking-tight mb-4">{t("category_hero_title", { category })}</h1>
          <p className="text-white/90 text-lg leading-relaxed font-body font-medium">
            {t("category_hero_description", { category: category.toLowerCase() })}
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
            placeholder={t("category_search_placeholder")}
            className="w-full pl-11 pr-4 py-3 border-2 border-surface-200 rounded-full text-sm font-body shadow-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none transition-all"
          />
        </form>
        <span className="text-sm font-bold text-gray-900 hidden sm:block bg-surface-100 px-4 py-2 rounded-full">
          {t("category_model_count", { count: result.total, category: category.toLowerCase() })}
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
          <p className="text-gray-900 text-lg font-bold mb-2">{t("category_no_products_title")}</p>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">{t("category_no_products_description")}</p>
          <Link href={`/categoria/${params.slug}`} className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-brand-red-dark transition-colors">
            {t("category_clear_filters")}
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
        <h2 className="font-display font-bold text-2xl mb-4">{t("category_seo_heading", { category: category.toLowerCase() })}</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-4">
          {t("category_seo_paragraph_1", { category: category.toLowerCase() })}
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          {t.rich("category_seo_paragraph_2", {
            b: (chunks) => <b>{chunks}</b>,
          })}
        </p>
      </div>
    </div>
  );
}
