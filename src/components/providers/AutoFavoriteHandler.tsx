"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites-store";
import { useAuth } from "@/lib/auth-context";

function Handler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const autoFavorite = searchParams.get("autoFavorite");
      if (autoFavorite) {
        const productId = parseInt(autoFavorite, 10);
        if (!isNaN(productId) && !isFavorite(productId)) {
          // Add to favorites
          toggleFavorite(productId).then(() => {
            // Remove parameter from URL without refreshing page
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("autoFavorite");
            const newUrl = pathname + (newParams.toString() ? '?' + newParams.toString() : '');
            router.replace(newUrl, { scroll: false });
          });
        }
      }
    }
  }, [isAuthenticated, searchParams, toggleFavorite, isFavorite, pathname, router]);

  return null;
}

export function AutoFavoriteHandler() {
  return (
    <Suspense fallback={null}>
      <Handler />
    </Suspense>
  );
}
