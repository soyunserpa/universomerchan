"use client";

import { useState, useCallback } from "react";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { CatalogProductResponse } from "@/lib/catalog-api";
import { loadMoreProducts } from "@/app/catalog/actions";
import Link from "next/link";
import { Search } from "lucide-react";
import { Loader2 } from "lucide-react";

interface InfiniteProductGridProps {
  initialProducts: CatalogProductResponse[];
  totalPages: number;
  searchParams: any; // { category, subcategory, search, sort, green, color }
}

export function InfiniteProductGrid({
  initialProducts,
  totalPages,
  searchParams,
}: InfiniteProductGridProps) {
  const [products, setProducts] = useState<CatalogProductResponse[]>(initialProducts);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = page < totalPages;

  const fetchNextPage = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    try {
      const nextPage = page + 1;
      const result = await loadMoreProducts({ ...searchParams, page: String(nextPage) });
      
      setProducts((prev) => {
        // Prevent duplicates in case of React Strict Mode double-firing or quick scrolling
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = result.products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      });
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading, searchParams]);

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-900 text-lg mb-2">No se encontraron productos</p>
        <p className="text-gray-900 text-sm mb-6">Prueba con otros filtros o términos de búsqueda</p>
        <Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full">
          Ver todos los productos
        </Link>
      </div>
    );
  }

  // Next page for SEO fallback link
  const queryParams = new URLSearchParams(searchParams);
  queryParams.set("page", String(page + 1));
  const fallbackUrl = `/catalog?${queryParams.toString()}`;

  return (
    <div className="mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((product, i) => (
          <ProductCard key={`${product.masterCode}-${i}`} product={product} index={i} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center w-full py-8">
          {isLoading ? (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="animate-spin" size={24} />
              <span className="font-medium text-sm">Cargando productos...</span>
            </div>
          ) : (
            <a
              href={fallbackUrl}
              onClick={(e) => {
                e.preventDefault();
                fetchNextPage();
              }}
              className="px-8 py-3.5 bg-brand-red text-white font-bold rounded-full shadow hover:bg-red-700 transition"
            >
              Cargar más productos
            </a>
          )}
        </div>
      )}
    </div>
  );
}
