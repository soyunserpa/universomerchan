"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowUpDown } from "lucide-react";

interface CatalogFiltersProps {
  categories: Array<{ name: string; slug: string; productCount: number }>;
  subcategories: Array<{ name: string; slug: string; productCount: number }>;
  currentCategory: string;
  currentSubcategory: string;
  currentSort: string;
  currentColor?: string;
  greenOnly: boolean;
  search: string;
}

export function CatalogFilters({ categories, subcategories, currentCategory, currentSubcategory, currentSort, currentColor, greenOnly, search }: CatalogFiltersProps) {
  const router = useRouter();

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const values: Record<string, string | undefined> = {
      category: currentCategory === "Todos" ? undefined : currentCategory,
      subcategory: currentSubcategory === "Todas" ? undefined : currentSubcategory,
      sort: currentSort === "newest" ? undefined : currentSort,
      color: currentColor === "Todos" ? undefined : currentColor,
      search: search || undefined,
      green: greenOnly ? "true" : undefined,
      ...overrides,
    };
    Object.entries(values).forEach(([k, v]) => {
      if (v && v !== "Todos" && v !== "Todas" && v !== "newest") params.set(k, v);
    });
    return `/catalog${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="space-y-3">
      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.name}
            onClick={() => router.push(buildUrl({ category: cat.name === "Todos" ? undefined : cat.name, subcategory: undefined, page: undefined }))}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentCategory === cat.name
                ? "bg-brand-red text-white"
                : "bg-surface-100 text-gray-900 hover:bg-surface-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Subcategory pills — only shown when a category is selected and has subcategories */}
      {subcategories.length > 1 && (
        <div className="flex gap-2 flex-wrap items-center p-3 bg-surface-50 border border-surface-200 rounded-2xl relative w-full">
          <div className="hidden sm:flex items-center text-gray-400 text-xs font-bold uppercase tracking-wider pr-2 border-r border-surface-200 mr-1">
            ↳ {currentCategory}
          </div>
          <button
            onClick={() => router.push(buildUrl({ subcategory: undefined, page: undefined }))}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              currentSubcategory === "Todas"
                ? "bg-gray-800 text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-gray-100 border border-surface-200"
            }`}
          >
            Todas
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.name}
              onClick={() => router.push(buildUrl({ subcategory: sub.name, page: undefined }))}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                currentSubcategory === sub.name
                  ? "bg-gray-800 text-white shadow-sm"
                  : "bg-white text-gray-700 hover:bg-gray-100 border border-surface-200"
              }`}
            >
              {sub.name} <span className={currentSubcategory === sub.name ? "opacity-70" : "text-gray-400"}>({sub.productCount})</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-1.5 text-gray-900 bg-surface-50 px-3 py-1.5 rounded-full">
          <ArrowUpDown size={14} />
          <select
            value={currentSort}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value === "newest" ? undefined : e.target.value, page: undefined }))}
            className="bg-transparent text-sm font-medium text-gray-900 border-none cursor-pointer focus:ring-0 p-0"
          >
            <option value="newest">Más recientes</option>
            <option value="name">Nombre A-Z</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="stock">Más stock</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5 text-gray-900 bg-surface-50 px-3 py-1.5 rounded-full">
          <div className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: currentColor && currentColor !== "Todos" ? getHexForColor(currentColor) : "transparent" }} />
          <select
            value={currentColor || "Todos"}
            onChange={(e) => router.push(buildUrl({ color: e.target.value === "Todos" ? undefined : e.target.value, page: undefined }))}
            className="bg-transparent text-sm font-medium text-gray-900 border-none cursor-pointer focus:ring-0 p-0"
          >
            <option value="Todos">Cualquier Color</option>
            <option value="Negro">Negro</option>
            <option value="Blanco">Blanco</option>
            <option value="Azul">Azul</option>
            <option value="Rojo">Rojo</option>
            <option value="Verde">Verde</option>
            <option value="Amarillo">Amarillo</option>
            <option value="Naranja">Naranja</option>
            <option value="Rosa">Rosa</option>
            <option value="Morado">Morado</option>
            <option value="Gris">Gris</option>
            <option value="Madera">Madera / Natural</option>
            <option value="Marron">Marrón</option>
          </select>
        </div>

        <button
          onClick={() => router.push(buildUrl({ green: greenOnly ? undefined : "true", page: undefined }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${
            greenOnly
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-surface-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
          }`}
        >
          <Leaf size={12} /> Solo sostenibles
        </button>
      </div>
    </div>
  );
}

function getHexForColor(color: string) {
  const map: Record<string, string> = {
    Negro: "#222222", Blanco: "#F8F8F8", Azul: "#1E40AF", Rojo: "#DC2626",
    Verde: "#15803D", Amarillo: "#EAB308", Naranja: "#EA580C", Rosa: "#EC4899",
    Morado: "#7C3AED", Gris: "#6B7280", Madera: "#D2B48C", Marron: "#78350F"
  };
  return map[color] || "#9CA3AF";
}
