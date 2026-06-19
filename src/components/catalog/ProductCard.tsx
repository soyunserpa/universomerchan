"use client";

import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Leaf, Palette, Star, Heart } from "lucide-react";
import type { CatalogProductResponse } from "@/lib/catalog-api";
import { useAuth } from "@/lib/auth-context";
import { useGlobalLogo } from "@/lib/global-logo-store";
import { useFavorites } from "@/lib/favorites-store";
import { useRouter, usePathname } from "@/i18n/routing";;

export function ProductCard({ product, index, isTopVenta }: { product: CatalogProductResponse; index: number; isTopVenta?: boolean }) {
  const { user, isAuthenticated } = useAuth();
  const { globalLogo } = useGlobalLogo();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  
  const uniqueColors = product.variants
    .filter((v, i, arr) => arr.findIndex((x) => x.color === v.color) === i)
    .slice(0, 5);

  const hasB2BDiscount = user?.discountPercent ? user.discountPercent > 0 : false;
  const discountedPriceRaw = hasB2BDiscount ? (product.startingPriceRaw * (1 - (user!.discountPercent / 100))) : product.startingPriceRaw;

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9]+/g, "-")    // Replace invalid characters with dash
      .replace(/(^-|-$)+/g, "");      // Trim dashes
  };
  const productSlug = `${product.masterCode.toLowerCase()}-${generateSlug(product.name || "producto")}`;

  return (
    <Link
      href={`/product/${productSlug}`}
      className={`bg-white rounded-2xl border ${isTopVenta ? 'border-amber-300 shadow-md ring-2 ring-amber-100' : 'border-surface-200'} overflow-hidden hover-lift animate-slide-up relative`}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Image */}
      <div className="w-full aspect-square bg-surface-50 flex items-center justify-center relative overflow-hidden group">
        
        {/* Favorite Button */}
        <button
          onClick={async (e) => {
            e.preventDefault(); // Prevent Link navigation
            e.stopPropagation();
            if (!isAuthenticated) {
              router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}&autoFavorite=${product.id}`);
              return;
            }
            await toggleFavorite(product.id);
          }}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-brand-red transition-all shadow-sm group/fav"
          aria-label={isFavorite(product.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Heart 
            size={18} 
            className={`transition-all ${isFavorite(product.id) ? "fill-brand-red text-brand-red scale-110" : "group-hover/fav:scale-110"}`} 
          />
        </button>

        {product.mainImage ? (
          <>
            <div className="w-[68%] h-[68%] relative z-10">
              <Image 
                src={product.mainImage} 
                alt={product.name} 
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                quality={70}
                className="object-contain" 
              />
            </div>
            {globalLogo && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none opacity-80 mix-blend-multiply group-hover:scale-110 transition-transform duration-500">
                <img src={globalLogo} alt="Logo" className="w-1/3 h-auto max-h-[30%] object-contain transform translate-y-4" />
              </div>
            )}
          </>
        ) : (
          <Palette size={40} className="text-gray-200" />
        )}

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {isTopVenta && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
              🔥 TOP VENTAS
            </span>
          )}
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
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            {hasB2BDiscount ? (
              <>
                <span className="text-xs text-gray-400 line-through mb-0.5">Base: {product.startingPriceRaw.toFixed(2)}€</span>
                <span className="font-bold text-base text-brand-red flex items-center gap-1">
                  Desde {discountedPriceRaw.toFixed(2)}€ <Star size={12} className="fill-brand-red text-brand-red" />
                </span>
                <span className="text-[10px] text-brand-red font-bold uppercase tracking-wider mt-0.5">TARIFA VIP</span>
              </>
            ) : (
              <span className="font-bold text-base text-brand-red">
                Desde {product.startingPriceRaw.toFixed(2)}€
              </span>
            )}
          </div>
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
