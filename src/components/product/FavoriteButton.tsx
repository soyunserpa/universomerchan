"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites-store";
import { useAuth } from "@/lib/auth-context";
import { useRouter, usePathname } from "@/i18n/routing";;

export function FavoriteButton({ productId, variant = "icon" }: { productId: number, variant?: "icon" | "button" }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [pulse, setPulse] = useState(false);
  const active = isFavorite(productId);

  useEffect(() => {
    // If not active, trigger a gentle pulse after 10 seconds of staying on the page
    if (!active) {
      const timer = setTimeout(() => setPulse(true), 10000);
      return () => clearTimeout(timer);
    } else {
      setPulse(false);
    }
  }, [active]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}&autoFavorite=${productId}`);
      return;
    }
    await toggleFavorite(productId);
    setPulse(false);
  };

  if (variant === "button") {
    return (
      <button 
        onClick={handleClick}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
          active 
            ? "bg-red-50 text-brand-red border border-red-100" 
            : "bg-surface-50 text-gray-600 hover:bg-surface-100 border border-surface-200"
        } ${pulse ? "animate-pulse ring-2 ring-brand-red/30 ring-offset-1" : ""}`}
      >
        <Heart size={18} className={`transition-transform ${active ? "fill-brand-red scale-110" : ""}`} />
        {active ? "Guardado en Favoritos" : "Guardar para después"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`p-2.5 rounded-full bg-white text-gray-400 hover:text-brand-red transition-all shadow-sm border border-surface-200 ${pulse ? "animate-pulse ring-2 ring-brand-red/30 ring-offset-1" : ""}`}
      aria-label={active ? "Quitar de favoritos" : "Añadir a favoritos"}
    >
      <Heart 
        size={20} 
        className={`transition-all ${active ? "fill-brand-red text-brand-red scale-110" : "hover:scale-110"}`} 
      />
    </button>
  );
}
