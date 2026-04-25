"use client";

import { useState, useEffect, useCallback } from "react";

export interface ViewedProduct {
  masterCode: string;
  name: string;
  category: string;
  image: string;
  viewedAt: number;
}

const STORAGE_KEY = "universo_merchan_recently_viewed";
const MAX_ITEMS = 6;

export function useRecentlyViewed() {
  const [history, setHistory] = useState<ViewedProduct[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  const addProduct = useCallback((product: Omit<ViewedProduct, "viewedAt">) => {
    setHistory((prev) => {
      // Remove if it exists
      const filtered = prev.filter(p => p.masterCode !== product.masterCode);
      
      // Add to front
      const newHistory = [
        { ...product, viewedAt: Date.now() },
        ...filtered
      ].slice(0, MAX_ITEMS);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
      } catch {
        // Ignore
      }
      
      return newHistory;
    });
  }, []);

  return {
    history,
    addProduct
  };
}
