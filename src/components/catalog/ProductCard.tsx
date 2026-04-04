"use client";

import Link from "next/link";
import { Leaf, Palette } from "lucide-react";
import type { CatalogProductResponse } from "@/lib/catalog-api";

export function ProductCard({ product, index }: { product: CatalogProductResponse; index: number }) {
  const uniqueColors = product.variants
    .filter((v, i, arr) => arr.findIndex((x) => x.color === v.color) === i)
    .slice(0, 5);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "-")    // Replace invalid characters with dash
      .replace(/(^-|-$)+/g, "");      // Trim dashes
  };
  const productSlug = `${product.masterCode.toLowerCase()}-${generateSlug(product.name)}`;

  return (
    <Link
      href={`/product/${productSlug}`}
      className={`bg-white rounded-2xl border border-surface-200 overflow-hidden hover-lift animate-slide-up`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Image */}
      <div className="w-full aspect-square bg-surface-50 flex items-center justify-center relative overflow-hidden">
        {product.mainImage ? (
          <img src={product.mainImage} alt={product.name} className="w-[68%] h-[68%] object-contain" loading="lazy" />
        ) : (
          <Palette size={40} className="text-gray-200" />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.isGreen && (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-sm font-semibold px-2 py-0.5 rounded-full">
              <Leaf size={12} /> Eco
            </span>
          )}
        </div>
        <span className="absolute top-2.5 right-2.5 bg-surface-100 text-gray-900 text-sm font-semibold px-2 py-0.5 rounded-full">
          {product.totalStock.toLocaleString("es-ES")} uds
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-sm text-gray-900 font-semibold uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="font-display font-bold text-base mb-1 truncate">{product.name}</h3>
        <p className="text-sm text-gray-900 line-clamp-2 mb-3 leading-relaxed">
          {product.shortDescription}
        </p>
        <div className="flex justify-between items-center">
          <span className="font-bold text-base text-brand-red">
            Desde {product.startingPrice}
          </span>
          <div className="flex gap-1">
            {uniqueColors.map((v, i) => (
              <div
                key={i}
                className="w-3.5 h-3.5 rounded-full border-2 border-surface-200"
                style={{ background: v.colorHex }}
                title={v.color}
              />
            ))}
            {product.variants.length > 5 && (
              <span className="text-sm text-gray-900 leading-[14px]">+{product.variants.length - 5}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
