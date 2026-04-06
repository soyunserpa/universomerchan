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
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: string; value: number; freeShipping?: boolean } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.type === "percentage") {
      return subtotal * (appliedCoupon.value / 100);
    }
    return Math.min(appliedCoupon.value, subtotal);
  };

  const discountAmount = calculateDiscount();
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/cart/apply-coupon", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal })
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon({ code: data.coupon.code, type: data.coupon.discountType, value: data.coupon.discountValue, freeShipping: data.coupon.freeShipping });
        setCouponCode("");
      } else {
        setCouponError(data.error);
      }
    } catch { setCouponError("Error de conexión"); }
    setApplyingCoupon(false);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/cart");
      return;
    }
    const url = appliedCoupon ? `/checkout/address?coupon=${appliedCoupon.code}` : "/checkout/address";
    router.push(url);
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
        setQuoteMessage(`¡Presupuesto ${data.quoteNumber} generado con éxito! Iniciando descarga...`);
        if (data.pdfUrl) {
          const a = document.createElement("a");
          a.href = data.pdfUrl;
          a.target = "_blank";
          a.download = `${data.quoteNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
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
        <p className="text-gray-900 mb-8">Explora nuestro catálogo y encuentra el producto perfecto para tu marca</p>
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
        <span className="text-sm text-gray-900">{itemCount} producto{itemCount > 1 ? "s" : ""} · {totalItems} unidades</span>
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
                      <p className="text-sm text-gray-900 mt-0.5">
                        {item.color}{item.size ? ` · ${item.size}` : ""} · REF: {item.productMasterCode}
                      </p>
                    </div>
                    <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-1">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Customization badge */}
                  {item.customization && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm">
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
                      <span className="text-sm text-gray-900 ml-1">uds</span>
                    </div>

                    <div className="text-right">
                      <p className="font-display font-extrabold text-lg text-brand-red">{item.totalPrice.toFixed(2)}€</p>
                      <p className="text-sm text-gray-900">{item.unitPriceTotal.toFixed(2)}€/ud</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Clear cart */}
          <div className="flex justify-between items-center pt-2">
            <Link href="/catalog" className="text-sm text-gray-900 hover:text-gray-700 flex items-center gap-1.5 transition-colors">
              <ArrowLeft size={14} /> Seguir comprando
            </Link>
            <button onClick={clearCart} className="text-sm text-gray-900 hover:text-red-500 flex items-center gap-1.5 transition-colors">
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
                  <span className="text-gray-900 truncate mr-2">{item.productName} ×{item.quantity}</span>
                  <span className="font-semibold flex-shrink-0">{item.totalPrice.toFixed(2)}€</span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-200 pt-3 mb-1">
              
              {/* Coupon Box */}
              <div className="mb-4">
                {!appliedCoupon ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Código de descuento"
                      className="w-full flex-1 px-3 py-2 border rounded-lg text-sm font-mono uppercase focus:ring-1 focus:ring-brand-red focus:border-brand-red outline-none disabled:bg-gray-50"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === "Enter" && handleApplyCoupon()}
                      disabled={applyingCoupon}
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      className="bg-gray-900 text-white px-4 rounded-lg text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {applyingCoupon ? "..." : "Aplicar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 text-green-700 text-sm">
                      <Tag size={16} />
                      <span className="font-bold font-mono">{appliedCoupon.code}</span>
                      <span>(-{appliedCoupon.type === "percentage" ? `${appliedCoupon.value}%` : `${appliedCoupon.value}€`}{appliedCoupon.freeShipping ? " + Envío Gratis" : ""})</span>
                    </div>
                    <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                {couponError && <p className="text-red-500 text-sm mt-1.5">{couponError}</p>}
              </div>

              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-900">Subtotal</span>
                <span className="font-semibold text-gray-700">{subtotal.toFixed(2)}€</span>
              </div>
              
              {appliedCoupon && (
                 <div className="flex justify-between text-sm mb-1 text-green-600 font-medium">
                   <span>Descuento ({appliedCoupon.code})</span>
                   <span>-{discountAmount.toFixed(2)}€</span>
                 </div>
              )}

              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-900">Envío</span>
                <span className="text-green-600 font-medium text-sm">{appliedCoupon?.freeShipping ? "Gratis" : "Se calcula en el checkout"}</span>
              </div>
            </div>

            <div className="border-t-2 border-gray-900 pt-3 mb-5">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">Total estimado</span>
                <span className="font-display font-extrabold text-2xl text-brand-red">{finalTotal.toFixed(2)}€</span>
              </div>
              <p className="text-sm text-gray-900 text-right">IVA no incluido</p>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              className="w-full bg-brand-red text-white py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors mb-3"
            >
              <CreditCard size={16} /> {isAuthenticated ? "Continuar al pago" : "Iniciar sesión para comprar"}
            </button>

            {/* Trust badges */}
            <div className="mt-5 pt-4 border-t border-surface-100 space-y-2.5">
              {[
                { icon: ShieldCheck, text: "Pago seguro con Stripe" },
                { icon: Truck, text: "Entrega en menos de 10 días" },
                { icon: Package, text: "Producción 80% europea" },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-900">
                  <badge.icon size={14} className="text-gray-900 flex-shrink-0" />
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
