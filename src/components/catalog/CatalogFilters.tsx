"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowUpDown } from "lucide-react";

interface CatalogFiltersProps {
  categories: Array<{ name: string; slug: string; productCount: number }>;
  currentCategory: string;
  currentSort: string;
  greenOnly: boolean;
  search: string;
}

export function CatalogFilters({ categories, currentCategory, currentSort, greenOnly, search }: CatalogFiltersProps) {
  const router = useRouter();

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const values: Record<string, string | undefined> = {
      category: currentCategory === "Todos" ? undefined : currentCategory,
      sort: currentSort === "name" ? undefined : currentSort,
      search: search || undefined,
      green: greenOnly ? "true" : undefined,
      ...overrides,
    };
    Object.entries(values).forEach(([k, v]) => {
      if (v && v !== "Todos" && v !== "name") params.set(k, v);
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
            onClick={() => router.push(buildUrl({ category: cat.name === "Todos" ? undefined : cat.name, page: undefined }))}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              currentCategory === cat.name
                ? "bg-brand-red text-white"
                : "bg-surface-100 text-gray-500 hover:bg-surface-200"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Sort and eco filter */}
      <div className="flex gap-3 items-center">
        <div className="flex items-center gap-1.5 text-gray-400">
          <ArrowUpDown size={14} />
          <select
            value={currentSort}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value === "name" ? undefined : e.target.value, page: undefined }))}
            className="bg-transparent text-sm font-medium text-gray-500 border-none cursor-pointer focus:ring-0 py-1"
          >
            <option value="name">Nombre A-Z</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="stock">Más stock</option>
            <option value="newest">Más recientes</option>
          </select>
        </div>

        <button
          onClick={() => router.push(buildUrl({ green: greenOnly ? undefined : "true", page: undefined }))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
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
