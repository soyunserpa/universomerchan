"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./auth-context";

interface FavoritesContextType {
  favoriteIds: number[];
  isLoading: boolean;
  toggleFavorite: (productId: number) => Promise<void>;
  isFavorite: (productId: number) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      setIsLoading(true);
      fetch("/api/favorites", {
        headers: { "Authorization": `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.favoriteProductIds) {
            setFavoriteIds(data.favoriteProductIds);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setFavoriteIds([]);
      setIsLoading(false);
    }
  }, [user, token]);

  const toggleFavorite = async (productId: number) => {
    if (!token) return;

    // Optimistic UI update
    const isFav = favoriteIds.includes(productId);
    if (isFav) {
      setFavoriteIds(prev => prev.filter(id => id !== productId));
    } else {
      setFavoriteIds(prev => [...prev, productId]);
    }

    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      
      const data = await res.json();
      if (data.error) {
        // Revert on error
        if (isFav) {
          setFavoriteIds(prev => [...prev, productId]);
        } else {
          setFavoriteIds(prev => prev.filter(id => id !== productId));
        }
      } else {
        // Sync with server state just to be sure
        if (data.isFavorite && !isFav) {
          setFavoriteIds(prev => Array.from(new Set([...prev, productId])));
        } else if (!data.isFavorite && isFav) {
          setFavoriteIds(prev => prev.filter(id => id !== productId));
        }
      }
    } catch (e) {
      console.error(e);
      // Revert on error
      if (isFav) {
        setFavoriteIds(prev => [...prev, productId]);
      } else {
        setFavoriteIds(prev => prev.filter(id => id !== productId));
      }
    }
  };

  const isFavorite = (productId: number) => {
    return favoriteIds.includes(productId);
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isLoading, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
}
