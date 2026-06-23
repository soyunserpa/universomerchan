"use client";

import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";;
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  ArrowLeft, CreditCard, Truck, Zap, MapPin, User, Building2, Tag,
  Mail, Phone, ShieldCheck, Lock, Gift, RefreshCw, Briefcase, Check
} from "lucide-react";

export default function CheckoutAddressPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="animate-spin text-gray-300" /></div>}>
      <CheckoutAddressPage />
    </Suspense>
  );
}

function CheckoutAddressPage() {
  const t = useTranslations("Checkout");
  const { state, subtotal, itemCount, clearCart } = useCart();
  const { user, token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const couponCode = searchParams.get("coupon");

  // Full EU country list, with names auto-localized to the current language
  // (Intl.DisplayNames → no manual translation needed), sorted alphabetically.
  const EU_COUNTRY_CODES = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO","SK","SI","ES","SE"];
  const euCountries = useMemo(() => {
    let dn: Intl.DisplayNames | null = null;
    try { dn = new Intl.DisplayNames([locale], { type: "region" }); } catch { dn = null; }
    return EU_COUNTRY_CODES
      .map((code) => ({ code, name: (dn?.of(code)) || code }))
      .sort((a, b) => a.name.localeCompare(b.name, locale));
  }, [locale]);

  const [form, setForm] = useState({
    name: "", company: "", cif: "", street: "", postalCode: "", city: "", country: "ES", email: "", phone: "",
  });
  
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [appliedCoupon, setAppliedCoupon] = useState<{ type: string; value: number; freeShipping?: boolean } | null>(null);

  // Fetch coupon details on load if code exists in URL
  useEffect(() => {
    if (couponCode && state.items.length > 0) {
      fetch("/api/cart/apply-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotal })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAppliedCoupon({ type: data.coupon.discountType, value: data.coupon.discountValue, freeShipping: data.coupon.freeShipping });
        }
      })
      .catch(() => {});
    }
  }, [couponCode, state.items.length, subtotal]);

  // Pre-fill from user profile OR sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("checkout_form");
      if (saved) {
        setForm(prev => ({ ...prev, ...JSON.parse(saved) }));
        return; // Don't override with user if we have saved session data
      }
    } catch (e) {}

    if (user) {
      setForm(prev => ({
        ...prev,
        name: `${user.firstName} ${user.lastName}`.trim() || prev.name,
        company: user.companyName || prev.company,
        cif: (user as any).cif || prev.cif,
        phone: (user as any).phone || prev.phone,
        email: user.email || prev.email,
        street: (user as any).shippingStreet || prev.street,
        city: (user as any).shippingCity || prev.city,
        postalCode: (user as any).shippingPostalCode || prev.postalCode,
      }));
    }
  }, [user]);

  // País por IP (Cloudflare CF-IPCountry): pre-selecciona el país de envío al cargar,
  // SOLO si sigue en el "ES" por defecto y el usuario no lo ha cambiado a mano.
  const countryTouched = useRef(false);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/geo")
      .then((r) => r.json())
      .then((d) => {
        const c = (d?.country || "").toUpperCase();
        if (cancelled || countryTouched.current || !EU_COUNTRY_CODES.includes(c)) return;
        setForm((prev) => (prev.country === "ES" ? { ...prev, country: c } : prev));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Save form to sessionStorage on change
  useEffect(() => {
    sessionStorage.setItem("checkout_form", JSON.stringify(form));
  }, [form]);

  // Redirect if empty cart
  useEffect(() => {
    if (!isLoading && state.items.length === 0) router.push("/cart");
  }, [isLoading, state.items.length, router]);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  let baseShippingCost = 0;
  if (subtotal < 100) baseShippingCost = 16;
  else if (subtotal < 300) baseShippingCost = 8;
  
  let finalShippingCost = baseShippingCost;
  let discountAmount = 0;

  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      const perc = appliedCoupon.value / 100;
      discountAmount = subtotal * perc;
      finalShippingCost = baseShippingCost * (1 - perc);
    } else {
      discountAmount = Math.min(appliedCoupon.value, subtotal);
      if (appliedCoupon.value > subtotal) {
        const leftOver = appliedCoupon.value - subtotal;
        finalShippingCost = Math.max(0, baseShippingCost - leftOver);
      }
    }
    if (appliedCoupon.freeShipping) {
      finalShippingCost = 0;
    }
  } else if (user?.discountPercent) {
    discountAmount = subtotal * (user.discountPercent / 100);
    finalShippingCost = baseShippingCost * (1 - user.discountPercent / 100);
  }

  const baseTotal = subtotal - discountAmount + finalShippingCost;
  // Estimated VAT by destination country (standard rates). The real tax — including
  // intra-EU B2B reverse charge with a valid VAT-ID — is computed by Stripe Tax at payment.
  const VAT_RATES: Record<string, number> = {
    ES: 0.21, PT: 0.23, FR: 0.20, DE: 0.19, IT: 0.22, NL: 0.21, BE: 0.21, AT: 0.20,
    BG: 0.20, HR: 0.25, CY: 0.19, CZ: 0.21, DK: 0.25, EE: 0.22, FI: 0.255, GR: 0.24,
    HU: 0.27, IE: 0.23, LV: 0.21, LT: 0.21, LU: 0.17, MT: 0.18, PL: 0.23, RO: 0.19,
    SK: 0.23, SI: 0.22, SE: 0.25,
  };
  const vatRate = VAT_RATES[form.country] ?? 0.21;
  const taxAmount = baseTotal * vatRate;
  const finalTotal = baseTotal + taxAmount;
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer">("card");

  const hasPrintItems = state.items.some(item => item.orderType === "PRINT");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.name || !form.street || !form.city || !form.postalCode || !form.email || !form.phone) {
      setError(t("error_required_fields"));
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
          expressShipping: subtotal < 300,
          customerNotes: notes || undefined,
          userId: user?.id,
          couponCode: couponCode || undefined,
          paymentMethod, // NEW: send payment method choice
          locale, // Send current language
        }),
      });

      const data = await res.json();

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || t("error_payment_processing"));
        setLoading(false);
      }
    } catch {
      setError(t("error_connection"));
      setLoading(false);
    }
  };

  if (isLoading || state.items.length === 0) {
    return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="animate-spin text-gray-300" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/cart" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> {t("back_to_cart")}
      </Link>

      <div className="w-full max-w-xl mx-auto mb-16 mt-2 px-6 animate-fade-in relative">
        <div className="absolute top-[18px] left-[10%] right-[10%] h-[3px] bg-surface-200 -z-10 rounded-full"></div>
        <div className="absolute top-[18px] left-[10%] w-[40%] h-[3px] bg-brand-red -z-10 rounded-full transition-all duration-1000"></div>
        <div className="flex justify-between items-center relative z-10 w-full">
          
          <div className="flex flex-col items-center gap-2 relative">
            <Link href="/cart" className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center font-bold shadow-md hover:scale-105 transition-transform">
              <Check size={20} />
            </Link>
            <span className="text-xs font-semibold text-gray-900 absolute -bottom-6">{t("step_cart")}</span>
          </div>

          <div className="flex flex-col items-center gap-2 relative">
            <div className="w-10 h-10 rounded-full bg-brand-red text-white flex items-center justify-center font-bold shadow-lg shadow-brand-red/30 ring-4 ring-brand-red/10">
              2
            </div>
            <span className="text-xs font-bold text-brand-red absolute -bottom-6 whitespace-nowrap">{t("step_details_payment")}</span>
          </div>

          <div className="flex flex-col items-center gap-2 relative">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-surface-200 text-gray-400 flex items-center justify-center font-bold">
              3
            </div>
            <span className="text-xs font-semibold text-gray-400 absolute -bottom-6 whitespace-nowrap">{t("step_confirmation")}</span>
          </div>

        </div>
      </div>

      <h1 className="font-display font-extrabold text-3xl mb-8">{t("page_title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h2 className="font-display font-bold text-lg mb-5 flex items-center gap-2">
              <MapPin size={18} className="text-brand-red" /> {t("shipping_title")}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">{t("field_name")}</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.name} onChange={e => update("name", e.target.value)} required placeholder={t("placeholder_name")} className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="text-sm font-semibold mb-1.5 block">{t.rich("field_company", { optional: (chunks) => <span className="text-gray-400 font-normal">{chunks}</span> })}</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.company} onChange={e => update("company", e.target.value)} placeholder={t("placeholder_company")} className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label className="text-sm font-semibold mb-1.5 block">{t.rich("field_cif", { optional: (chunks) => <span className="text-gray-400 font-normal">{chunks}</span> })}</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.cif} onChange={e => update("cif", e.target.value)} placeholder="B12345678" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm uppercase" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">{t("field_address")}</label>
                <input type="text" value={form.street} onChange={e => update("street", e.target.value)} required placeholder={t("placeholder_address")} className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">{t("field_postal")}</label>
                <input type="text" value={form.postalCode} onChange={e => update("postalCode", e.target.value)} required placeholder="28001" className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">{t("field_city")}</label>
                <input type="text" value={form.city} onChange={e => update("city", e.target.value)} required placeholder="Madrid" className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold mb-1.5 block">{t("field_country")}</label>
                <select value={form.country} onChange={e => { countryTouched.current = true; update("country", e.target.value); }} required className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm bg-white">
                  {euCountries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">{t("field_email")}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="email" value={form.email} onChange={e => update("email", e.target.value)} required placeholder="tu@empresa.com" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold mb-1.5 block">{t("field_phone")}</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} required placeholder="+34 600 000 000" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>
            </div>
          </div>

          {/* Shipping method (Midocean Auto) */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Truck size={18} className="text-brand-red" /> {t("shipping_method_title")}
            </h2>

            <div className="space-y-3">
              {subtotal < 100 ? (
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-brand-red bg-brand-red/5">
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold">{t("shipping_basic_title")}</p>
                      <p className="text-xs text-gray-400">{t("shipping_basic_desc")}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">16,00€</span>
                </div>
              ) : subtotal < 300 ? (
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-brand-red bg-brand-red/5">
                  <div className="flex items-center gap-3">
                    <Zap size={20} className="text-amber-500" />
                    <div>
                      <p className="text-sm font-semibold">{t("shipping_direct_title")}</p>
                      <p className="text-xs text-gray-400">{t("shipping_direct_desc")}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm">8,00€</span>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 rounded-xl border-2 border-green-500 bg-green-50">
                  <div className="flex items-center gap-3">
                    <Truck size={20} className="text-green-600" />
                    <div>
                      <p className="text-sm font-semibold">{t("shipping_standard_title")}</p>
                      <p className="text-xs text-gray-500">{t("shipping_standard_desc")}</p>
                    </div>
                  </div>
                  <span className="font-bold text-sm text-green-600">{t("free")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
             <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-brand-red" /> {t("payment_method_title")}
             </h2>
             <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "card" ? "border-brand-red bg-brand-red/5" : "border-surface-200 hover:border-surface-300"}`}>
                   <input type="radio" name="paymentMethod" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="mt-1 w-4 h-4 accent-brand-red cursor-pointer" />
                   <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between w-full">
                        <p className="text-sm font-semibold">{t("payment_card_title")}</p>
                        <div className="flex items-center gap-1 opacity-70">
                           <CreditCard size={14}/> <Zap size={14}/>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{t("payment_card_desc")}</p>
                   </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "transfer" ? "border-brand-red bg-brand-red/5" : "border-surface-200 hover:border-surface-300"}`}>
                   <input type="radio" name="paymentMethod" value="transfer" checked={paymentMethod === "transfer"} onChange={() => setPaymentMethod("transfer")} className="mt-1 w-4 h-4 accent-brand-red cursor-pointer" />
                   <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center justify-between w-full">
                        <p className="text-sm font-semibold">{t("payment_transfer_title")}</p>
                      </div>
                      <p className="text-xs text-gray-500">{t("payment_transfer_desc")}</p>
                   </div>
                </label>
             </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-surface-200 p-6">
            <h2 className="font-display font-bold text-lg mb-3">{t.rich("notes_title", { optional: (chunks) => <span className="text-gray-400 font-normal text-sm">{chunks}</span> })}</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t("notes_placeholder")}
              className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm min-h-[80px] resize-none"
            />
          </div>

          {/* Legal Acknowledgement */}
          {hasPrintItems && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
               <input type="checkbox" id="legal-boceto" required className="mt-1 w-4 h-4 accent-brand-red border-surface-300 rounded flex-shrink-0 cursor-pointer" />
               <label htmlFor="legal-boceto" className="text-xs text-amber-900 font-medium leading-tight cursor-pointer">
                   {t("legal_acknowledgement")}
               </label>
            </div>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red text-white py-4 rounded-full font-semibold text-base flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-50"
          >
            {loading ? (
              <><RefreshCw size={18} className="animate-spin" /> {t("processing_payment")}</>
            ) : (
              <><Lock size={16} /> {t("pay_button")}</>
            )}
          </button>

          <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> {t("security_note")}</span>
          </div>
        </form>

        {/* Order summary sidebar */}
        <div>
          <div className="bg-white rounded-2xl border border-surface-200 p-5 sticky top-20">
            <h2 className="font-display font-bold text-base mb-4">{t("summary_title", { count: itemCount })}</h2>

            <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
              {state.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-12 h-12 rounded-lg bg-surface-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {item.customization?.mockupUrl || item.productImage ? <img src={item.customization?.mockupUrl || item.productImage} alt={item.productName || t("product_fallback")} className="w-[80%] h-[80%] object-contain" /> : <Gift size={14} className="text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.productName}</p>
                    <p className="text-[11px] text-gray-400">{t("item_units", { count: item.quantity })} · {item.color}</p>
                  </div>
                  <span className="text-xs font-bold flex-shrink-0">{item.totalPrice.toFixed(2)}€</span>
                </div>
              ))}
            </div>

            <div className="border-t border-surface-200 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t("subtotal")}</span>
                <span className="font-semibold">{subtotal.toFixed(2)}€</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span className="flex items-center gap-1"><Tag size={12} /> {t("coupon_label", { code: couponCode ?? "" })}</span>
                  <span>-{discountAmount.toFixed(2)}€{appliedCoupon.freeShipping ? ` ${t("coupon_free_shipping")}` : ""}</span>
                </div>
              )}

              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t("shipping")}</span>
                <span className={`font-semibold ${finalShippingCost === 0 ? "text-green-600" : ""}`}>
                  {finalShippingCost === 0 ? t("free") : `${finalShippingCost.toFixed(2)}€`}
                </span>
              </div>
              
              {!appliedCoupon && (user?.discountPercent ?? 0) > 0 ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1"><Tag size={12} /> {t("customer_discount")}</span>
                  <span className="font-semibold text-green-600">-{user!.discountPercent}%</span>
                </div>
              ) : null}
            </div>

            <div className="border-t-2 border-gray-900 pt-3 mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t("tax_base")}</span>
                <span className="font-semibold">{baseTotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t("vat_rate", { rate: Math.round(vatRate * 1000) / 10 })}</span>
                <span className="font-semibold">{taxAmount.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-surface-200">
                <span className="font-bold">{t("total_to_pay")}</span>
                <span className="font-display font-extrabold text-2xl text-brand-red">{finalTotal.toFixed(2)}€</span>
              </div>
              <p className="text-[11px] text-gray-400 text-right">{t("vat_included")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
