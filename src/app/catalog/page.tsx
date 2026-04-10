import React from 'react';
import Link from "next/link";
import { getProductList, getCategories, getSubcategories } from "@/lib/catalog-api";
import { ProductCard } from "@/components/catalog/ProductCard";
import { InfiniteProductGrid } from "@/components/catalog/InfiniteProductGrid";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface CatalogPageProps {
  searchParams: { category?: string; subcategory?: string; search?: string; page?: string; sort?: string; green?: string; color?: string; budget?: string };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const category = searchParams.category || "Todos";
  const subcategory = searchParams.subcategory || "Todas";
  const search = searchParams.search || "";
  const page = parseInt(searchParams.page || "1");
  const sort = (searchParams.sort || "newest") as any;
  const greenOnly = searchParams.green === "true";
  const color = searchParams.color || "Todos";
  const budget = searchParams.budget || "";
  const limit = 24;

  const [result, categories, subcategories] = await Promise.all([
    getProductList({
      category: category === "Todos" ? undefined : category,
      subcategory: subcategory === "Todas" ? undefined : subcategory,
      search, page, sort, greenOnly,
      color: color === "Todos" ? undefined : color,
      budget: budget === "" ? undefined : budget,
      limit,
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
        {search && <p className="text-gray-900 text-sm">Resultados para &quot;{search}&quot;</p>}
      </div>

      {/* Search bar */}
      <div className="flex gap-4 items-center mb-5">
        {/* Search is always global — navigates to /catalog?search=X without category scope */}
        <form action="/catalog" method="GET" className="flex-1 relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-900">
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
        <span className="text-sm text-gray-900 hidden sm:block">{result.total} productos</span>
      </div>

      {/* Mini Asistente Wizard */}
      <form action="/catalog" method="GET" className="bg-white border border-surface-200 rounded-2xl p-5 sm:p-6 flex flex-col lg:flex-row items-center gap-5 shadow-sm mb-8 w-full">
        <span className="font-semibold text-gray-900 whitespace-nowrap text-sm lg:text-base text-center lg:text-left flex-shrink-0">
          Encuentra merchandising rápido:
        </span>
        <div className="flex w-full gap-3 flex-col sm:flex-row">
          <select 
            name="category"
            title="Categoría de producto"
            aria-label="Categoría de producto"
            className="flex-1 bg-surface-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-red outline-none cursor-pointer text-gray-700"
            defaultValue={category === "Todos" ? "" : category}
          >
            <option value="">¿Buscas algún tipo en concreto?</option>
            <option value="Bolsos y viajes">🎒 Mochilas y Bolsas</option>
            <option value="Oficina y escritura">🖊️ Oficina y Escritura</option>
            <option value="Bebidas y comidas">☕ Tazas y Botellas</option>
            <option value="Tecnología">💻 Tecnología y Accesorios</option>
            <option value="Hogar y bienestar">🏡 Hogar y Bienestar</option>
            <option value="Lanyards y eventos">🎟️ Lanyards y Eventos</option>
          </select>
          <select 
            name="budget"
            title="Presupuesto"
            aria-label="Presupuesto"
            className="flex-1 bg-surface-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand-red outline-none cursor-pointer text-gray-700"
            defaultValue={budget || ""}
          >
            <option value="">🤑 Cualquier Presupuesto</option>
            <option value="under_1">Menos de 1€ / ud</option>
            <option value="1_to_5">Entre 1€ y 5€ / ud</option>
            <option value="5_to_20">Entre 5€ y 20€ / ud</option>
            <option value="over_20">Más de 20€ / ud</option>
          </select>
          <button type="submit" className="bg-brand-red text-white font-bold px-8 py-3 rounded-xl hover:bg-red-700 transition-all hover:shadow-md text-center">
            Ver sugerencias
          </button>
        </div>
      </form>

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
        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {result.products.map((product, i) => {
              const isTopVenta = page === 1 && (!sort || sort === "newest") && !search && (!category || category === "Todos") && i < 3;
              
              const banners = [
                {
                  bgClass: "bg-gradient-to-br from-brand-red to-red-800 text-white",
                  labelClass: "text-black font-black bg-white px-3 py-1 rounded inline-block",
                  title: "¿No encuentras lo que buscas?",
                  desc: "Tenemos acceso a más de 10.000 referencias en catálogo. Cuéntanos qué necesitas y lo buscamos para ti a precio de fábrica.",
                  buttonClass: "bg-black text-white hover:bg-white hover:text-black shadow-black/20"
                },
                {
                  bgClass: "bg-gradient-to-br from-surface-50 to-surface-200 text-gray-900 border border-surface-200",
                  labelClass: "text-brand-red",
                  title: "Preparamos tus campañas y eventos",
                  desc: "Anticípate a tus ferias o welcome packs de empleados. Pide presupuesto por volumen y sorpréndete con nuestros descuentos.",
                  buttonClass: "bg-brand-red text-white hover:bg-black hover:text-white shadow-brand-red/20"
                },
                {
                  bgClass: "bg-gradient-to-br from-gray-900 to-black text-white",
                  labelClass: "text-brand-red",
                  title: "¿Tienes un proyecto a medida?",
                  desc: "Nuestro equipo de expertos te asesora de forma gratuita para encontrar los regalos perfectos para tu próxima campaña corporativa. ¡Sin compromiso!",
                  buttonClass: "bg-white text-gray-900 hover:bg-brand-red hover:text-white shadow-brand-red/20"
                }
              ];
              const activeBanner = banners[page % 3];
              
              return (
                <React.Fragment key={`${product.masterCode}-${i}`}>
                  <ProductCard product={product} index={i} isTopVenta={isTopVenta} />
                  
                  {/* Banner Rompehielos después del producto 12 (index 11) */}
                  {i === 11 && (
                    <div className={`col-span-1 sm:col-span-2 lg:col-span-3 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-xl my-6 md:my-8 hover-lift ${activeBanner.bgClass}`}>
                      <div className="mb-6 md:mb-0 max-w-xl text-center md:text-left">
                        <span className={`font-bold tracking-wider text-sm mb-3 block uppercase ${activeBanner.labelClass}`}>Atención personalizada</span>
                        <h3 className="text-3xl md:text-4xl font-display font-extrabold mb-3">{activeBanner.title}</h3>
                        <p className="text-lg opacity-90">{activeBanner.desc}</p>
                      </div>
                      <a href="https://api.whatsapp.com/send/?phone=34614446640&text&type=phone_number&app_absent=0" target="_blank" rel="noopener noreferrer" className={`font-bold px-8 py-4 rounded-full transition-all shadow-lg transform hover:-translate-y-1 text-center ${activeBanner.buttonClass}`}>
                        Hablar con un asesor
                      </a>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
          
          {/* Pagination and Progress Bar Design */}
          {(page > 1 || page < result.pages) && (
            <div className="mt-16 flex flex-col items-center justify-center w-full max-w-lg mx-auto pb-12">
              {/* Progress Text */}
              <div className="text-center mb-4 w-full">
                <p className="text-gray-600 tracking-tight text-sm font-medium mb-3">
                  Has visto {Math.min(page * limit, result.total)} de {result.total} productos
                </p>
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-brand-red h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.round((Math.min(page * limit, result.total) / result.total) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex items-center gap-4 mt-4">
                {page > 1 ? (
                  <Link
                    href={`/catalog?${(() => {
                      const p = new URLSearchParams();
                      if (category && category !== "Todos") p.set("category", category);
                      if (subcategory && subcategory !== "Todas") p.set("subcategory", subcategory);
                      if (search) p.set("search", search);
                      if (sort && sort !== "newest") p.set("sort", sort as string);
                      if (greenOnly) p.set("green", "true");
                      if (color && color !== "Todos") p.set("color", color);
                      if (page - 1 > 1) p.set("page", String(page - 1));
                      return p.toString();
                    })()}`}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-full hover:bg-gray-50 hover:border-gray-300 transition duration-200 flex items-center gap-2 group shadow-sm"
                    scroll={true}
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" /> Anterior
                  </Link>
                ) : (
                  <div className="px-6 py-2.5 bg-gray-50 text-gray-400 border border-transparent font-semibold rounded-full flex items-center gap-2 cursor-not-allowed opacity-70">
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </div>
                )}
                
                {page < result.pages ? (
                  <Link
                    href={`/catalog?${(() => {
                      const p = new URLSearchParams();
                      if (category && category !== "Todos") p.set("category", category);
                      if (subcategory && subcategory !== "Todas") p.set("subcategory", subcategory);
                      if (search) p.set("search", search);
                      if (sort && sort !== "newest") p.set("sort", sort as string);
                      if (greenOnly) p.set("green", "true");
                      if (color && color !== "Todos") p.set("color", color);
                      p.set("page", String(page + 1));
                      return p.toString();
                    })()}`}
                    className="px-6 py-2.5 bg-gray-900 border border-gray-900 text-white font-semibold rounded-full hover:bg-black hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex items-center gap-2 group"
                    scroll={true}
                  >
                    Siguiente <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white transition" />
                  </Link>
                ) : (
                  <div className="px-6 py-2.5 bg-gray-100 text-gray-400 font-semibold rounded-full flex items-center gap-2 cursor-not-allowed opacity-70">
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-gray-900 text-lg mb-2">No se encontraron productos</p>
          <p className="text-gray-900 text-sm mb-6">Prueba con otros filtros o términos de búsqueda</p>
          <Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full">
            Ver todos los productos
          </Link>
        </div>
      )}
    </div>
  );
}
