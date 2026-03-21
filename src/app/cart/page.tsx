"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Gift, Trash2, Minus, Plus, ArrowLeft, ArrowRight, ShoppingCart,
  Download, Tag, Palette, Package, ShieldCheck, Truck, CreditCard,
} from "lucide-react";

export default function CartPage() {
  const { state, removeItem, updateQuantity, clearCart, subtotal, itemCount, totalItems } = useCart();
  const { isAuthenticated, user, token } = useAuth();
  const router = useRouter();
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteMessage, setQuoteMessage] = useState("");

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/cart");
      return;
    }
    router.push("/checkout/address");
  };

  const handleQuote = async () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/cart");
      return;
    }

    setQuoteLoading(true);
    setQuoteMessage("");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/quotes/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({ items: state.items, userId: user?.id }),
      });
      const data = await res.json();
      if (data.success) {
        setQuoteMessage(`Presupuesto ${data.quoteNumber} generado. Revisa tu email.`);
      } else {
        setQuoteMessage(data.error || "Error al generar presupuesto");
      }
    } catch {
      setQuoteMessage("Error de conexión");
    }
    setQuoteLoading(false);
  };

  if (state.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <ShoppingCart size={56} className="text-gray-200 mx-auto mb-4" />
        <h1 className="font-display font-extrabold text-3xl mb-3">Tu carrito está vacío</h1>
        <p className="text-gray-400 mb-8">Explora nuestro catálogo y encuentra el producto perfecto para tu marca</p>
        <Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-8 py-3 rounded-full hover:bg-brand-red-dark transition-colors">
          Explorar catálogo <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-extrabold text-3xl">Tu carrito</h1>
        <span className="text-sm text-gray-400">{itemCount} producto{itemCount > 1 ? "s" : ""} · {totalItems} unidades</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Cart items */}
        <div className="space-y-3">
          {state.items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-surface-200 p-5 animate-fade-in">
              <div className="flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-surface-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {item.productImage ? (
                    <img src={item.productImage} alt={item.productName} className="w-[80%] h-[80%] object-contain" />
                  ) : (
                    <Gift size={24} className="text-gray-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/product/${item.productMasterCode}`} className="font-semibold text-sm hover:text-brand-red transition-colors">
                        {item.productName}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.color}{item.size ? ` · ${item.size}` : ""} · REF: {item.productMasterCode}
                      </p>
                    </div>
                    <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-1">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Customization badge */}
                  {item.customization && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <Palette size={12} className="text-purple-500" />
                      <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-medium">
                        {item.customization.positions.map(p => p.techniqueName).join(" + ")}
                      </span>
                    </div>
                  )}

                  {/* Quantity + Price */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(i, item.quantity - 10)}
                        className="w-8 h-8 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(i, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center py-1 border-2 border-surface-200 rounded-lg text-sm font-bold"
                      />
                      <button
                        onClick={() => updateQuantity(i, item.quantity + 10)}
                        className="w-8 h-8 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <span className="text-xs text-gray-400 ml-1">uds</span>
                    </div>

                    <div className="text-right">
                      <p className="font-display font-extrabold text-lg text-brand-red">{item.totalPrice.toFixed(2)}€</p>
                      <p className="text-[11px] text-gray-400">{item.unitPriceTotal.toFixed(2)}€/ud</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Clear cart */}
          <div className="flex justify-between items-center pt-2">
            <Link href="/catalog" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1.5 transition-colors">
              <ArrowLeft size={14} /> Seguir comprando
            </Link>
            <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors">
              <Trash2 size={14} /> Vaciar carrito
            </button>
          </div>
        </div>

        {/* Summary sidebar */}
        <div>
          <div className="bg-white rounded-2xl border border-surface-200 p-6 sticky top-20">
            <h2 className="font-display font-bold text-base mb-4">Resumen del pedido</h2>

            {/* Line totals */}
            <div className="space-y-2 mb-4">
              {state.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-400 truncate mr-2">{item.productName} ×{item.quantity}</span>
                  <span className="font-semibold flex-shrink-0">{item.totalPrice.toFixed(2)}€</span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-200 pt-3 mb-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-semibold">{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Envío</span>
                <span className="text-green-600 font-medium text-xs">Se calcula en el checkout</span>
              </div>
            </div>

            <div className="border-t-2 border-gray-900 pt-3 mb-5">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">Total estimado</span>
                <span className="font-display font-extrabold text-2xl text-brand-red">{subtotal.toFixed(2)}€</span>
              </div>
              <p className="text-[11px] text-gray-400 text-right">IVA no incluido</p>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="w-full bg-brand-red text-white py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors mb-3"
            >
              <CreditCard size={16} /> {isAuthenticated ? "Continuar al pago" : "Iniciar sesión para comprar"}
            </button>

            {/* Quote button */}
            <button
              onClick={handleQuote}
              disabled={quoteLoading}
              className="w-full py-2.5 rounded-full border-2 border-surface-200 text-sm font-medium flex items-center justify-center gap-2 text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-50"
            >
              <Download size={14} /> {quoteLoading ? "Generando..." : "Descargar presupuesto PDF"}
            </button>

            {quoteMessage && (
              <p className={`text-xs mt-2 text-center ${!quoteMessage.includes("generado") ? "text-red-500" : "text-green-600"}`}>
                {quoteMessage}
              </p>
            )}

            {/* Trust badges */}
            <div className="mt-5 pt-4 border-t border-surface-100 space-y-2.5">
              {[
                { icon: ShieldCheck, text: "Pago seguro con Stripe" },
                { icon: Truck, text: "Entrega en menos de 10 días" },
                { icon: Package, text: "Producción 80% europea" },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <badge.icon size={14} className="text-gray-300 flex-shrink-0" />
                  {badge.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
