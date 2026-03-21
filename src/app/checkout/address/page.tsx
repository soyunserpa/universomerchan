"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CreditCard, Truck, Zap, MapPin, User, Building2, Tag,
  Mail, Phone, ShieldCheck, Lock, Gift, RefreshCw,
} from "lucide-react";

export default function CheckoutAddressPage() {
  const { state, subtotal, itemCount, clearCart } = useCart();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "", company: "", street: "", postalCode: "", city: "", country: "ES", email: "", phone: "",
  });
  const isUnder300 = subtotal < 300;
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from user profile
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`.trim() || prev.name,
        company: user.companyName || prev.company,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Redirect if not authenticated or empty cart
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/auth/login?redirect=/cart");
    if (!isLoading && state.items.length === 0) router.push("/cart");
  }, [isLoading, isAuthenticated, state.items.length, router]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.street || !form.city || !form.postalCode || !form.email) {
      setError("Completa todos los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          items: state.items,
          shippingAddress: form,
          expressShipping: isUnder300,
          customerNotes: notes || undefined,
          userId: user?.id,
        }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || "Error al procesar el pago");
        setLoading(false);
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  if (isLoading || state.items.length === 0) {
    return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="animate-spin text-gray-300" /></div>;
  }

  const shippingCost = isUnder300 ? 24.95 : 0;
  const total = subtotal + shippingCost;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/cart" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver al carrito
      </Link>

      <h1 className="font-display font-extrabold text-3xl mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
              <MapPin size={18} className="text-brand-red" /> Dirección de envío
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">Nombre completo *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.name} onChange={e => update("name", e.target.value)} required placeholder="Nombre y apellidos" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">Empresa <span className="text-gray-400 font-normal">(opcional)</span></label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.company} onChange={e => update("company", e.target.value)} placeholder="Nombre de empresa" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">Dirección *</label>
                <input type="text" value={form.street} onChange={e => update("street", e.target.value)} required placeholder="Calle, número, piso, puerta" className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Código postal *</label>
                <input type="text" value={form.postalCode} onChange={e => update("postalCode", e.target.value)} required placeholder="28001" className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Ciudad *</label>
                <input type="text" value={form.city} onChange={e => update("city", e.target.value)} required placeholder="Madrid" className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Email *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} required placeholder="tu@empresa.com" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">Teléfono</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+34 600 000 000" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping method (Midocean Auto) */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Truck size={18} className="text-brand-red" /> Método de envío Midocean
            </h2>

            <div className="space-y-3">
              {isUnder300 ? (
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-brand-red bg-brand-red/5">
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold">Envío Directo (Gestión pequeña)</p>
                      <p className="text-xs text-gray-400">Aplicado a pedidos menores de 300€</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">24,95€</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-green-500 bg-green-50">
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-green-600" />
                    <div>
                      <p className="text-sm font-semibold">Envío Estándar</p>
                      <p className="text-xs text-gray-500">Pedidos mayores a 300€</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-green-600">Gratis</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h2 className="font-display font-bold text-lg mb-3">Notas del pedido <span className="text-gray-400 font-normal text-sm">(opcional)</span></h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Instrucciones especiales de entrega, referencia de compra interna..."
              className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm min-h-[80px] resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red text-white py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><RefreshCw size={18} className="animate-spin" /> Procesando...</>
            ) : (
              <><Lock size={16} /> Pagar {total.toFixed(2)}€ con Stripe</>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Pago seguro</span>
            <span>Visa · Mastercard · Apple Pay · Google Pay · SEPA</span>
          </div>
        </form>

        {/* Order summary sidebar */}
        <div>
          <div className="bg-white rounded-2xl border border-surface-200 p-5 sticky top-20">
            <h2 className="font-display font-bold text-base mb-4">Resumen ({itemCount} productos)</h2>

            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
              {state.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-surface-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.productImage ? <img src={item.productImage} alt="" className="w-[80%] h-[80%] object-contain" /> : <Gift size={14} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-400">{item.quantity} uds · {item.color}</p>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0">{item.totalPrice.toFixed(2)}€</span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-200 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-semibold">{subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Envío</span>
                <span className={`font-semibold ${isUnder300 ? "" : "text-green-600"}`}>
                  {isUnder300 ? "24,95€" : "Gratis"}
                </span>
              </div>
              {user?.discountPercent && user.discountPercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1"><Tag size={12} /> Descuento cliente</span>
                  <span className="font-semibold text-green-600">-{user.discountPercent}%</span>
                </div>
              )}
            </div>

            <div className="border-t-2 border-gray-900 pt-3 mt-3">
              <div className="flex justify-between items-baseline">
                <span className="font-bold">Total</span>
                <span className="font-display font-extrabold text-2xl text-brand-red">{total.toFixed(2)}€</span>
              </div>
              <p className="text-[11px] text-gray-400 text-right">IVA no incluido</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
