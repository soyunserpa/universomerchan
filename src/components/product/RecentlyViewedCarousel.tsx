"use client";

import React from "react";
import Link from "next/link";
import { useRecentlyViewed } from "@/lib/useRecentlyViewed";
import { ArrowRight, Clock } from "lucide-react";

export function RecentlyViewedCarousel() {
  const { history } = useRecentlyViewed();

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 border-t border-surface-200 pt-12 pb-8 w-full max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <Clock size={24} className="text-brand-red" /> 
            Vistos Recientemente
          </h2>
          <p className="text-gray-500 text-sm mt-1">Retoma tus presupuestos pendientes justo donde los dejaste.</p>
        </div>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-6 snap-x hide-scrollbar">
        {history.map((product) => {
          const slug = product.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
          const deterministicUrl = `/product/${product.masterCode.toLowerCase()}-${slug}`;

          return (
            <Link 
              key={product.masterCode}
              href={deterministicUrl}
              className="flex-shrink-0 w-44 sm:w-56 group border border-surface-200 hover:border-brand-red/30 bg-white rounded-2xl p-4 transition-all shadow-sm hover:shadow-md snap-start"
            >
              <div className="bg-surface-50 aspect-square rounded-xl mb-4 overflow-hidden relative flex items-center justify-center p-4">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="text-xs font-semibold text-brand-red mb-1 uppercase tracking-wider">{product.category}</div>
              <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug group-hover:text-brand-red transition-colors">
                {product.name}
              </h3>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
