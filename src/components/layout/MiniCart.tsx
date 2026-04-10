"use client";

import { useCart } from "@/lib/cart-store";
import Link from "next/link";
import { X, Gift, ShoppingCart, ArrowRight } from "lucide-react";

export function MiniCart() {
  const { state, removeItem, subtotal, itemCount, toggleCart } = useCart();

  if (!state.isOpen || state.items.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[199] animate-fade-in"
        onClick={() => toggleCart(false)}
      />

      {/* Cart panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-[200] animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-red" />
            <span className="font-display font-bold text-base">Tu carrito ({itemCount})</span>
          </div>
          <button onClick={() => toggleCart(false)} className="text-gray-400 hover:text-gray-600 p-1" title="Cerrar carrito">
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          {state.items.map((item, i) => (
            <div key={i} className="flex gap-3 py-3 border-b border-surface-100">
              <div className="w-14 h-14 rounded-lg bg-surface-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.productImage ? (
                  <img src={item.productImage} alt={item.productName} className="w-[80%] h-[80%] object-contain" />
                ) : (
                  <Gift size={18} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{item.productName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.quantity} uds · {item.color}
                  {item.customization ? ` · ${item.customization.positions.map(p => p.techniqueName).join(" + ")}` : ""}
                </p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <span className="text-sm font-bold text-brand-red">{item.totalPrice.toFixed(2)}€</span>
                <button onClick={() => removeItem(i)} className="text-xs text-gray-400 hover:text-red-500">
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-900 px-5 py-4 bg-white">
          <div className="flex justify-between items-baseline mb-2 text-sm">
            <span className="text-gray-400">Base Imponible</span>
            <span className="font-semibold text-gray-700">{subtotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-baseline mb-2 text-sm">
            <span className="text-gray-400">IVA (21%)</span>
            <span className="font-semibold text-gray-700">{(subtotal * 0.21).toFixed(2)}€</span>
          </div>
          <div className="flex justify-between items-baseline mb-4 pt-2 border-t border-surface-200">
            <span className="font-bold text-sm">Total</span>
            <span className="font-display font-extrabold text-xl text-brand-red">{(subtotal * 1.21).toFixed(2)}€</span>
          </div>
          <div className="space-y-2">
            <Link
              href="/cart"
              onClick={() => toggleCart(false)}
              className="w-full bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors"
            >
              Finalizar pedido <ArrowRight size={16} />
            </Link>
            <button
              onClick={() => toggleCart(false)}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 py-2"
            >
              Seguir comprando
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
