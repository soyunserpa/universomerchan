"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/lib/cart-store";
import { CheckCircle, Package, ArrowRight, Gift } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("order");
  const { clearCart } = useCart();
  useEffect(() => { clearCart(); }, [clearCart]);

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-500" /></div>
      <h1 className="font-display font-extrabold text-3xl mb-3">¡Pedido confirmado!</h1>
      {orderNumber && (<div className="bg-white rounded-2xl border border-surface-200 p-5 mb-6"><p className="text-sm text-gray-400 mb-1">Número de pedido</p><p className="font-display font-extrabold text-2xl text-brand-red">{orderNumber}</p></div>)}
      <p className="text-gray-400 leading-relaxed mb-8">Hemos recibido tu pedido y te hemos enviado un email de confirmación.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/account/orders" className="inline-flex items-center justify-center gap-2 bg-brand-red text-white font-semibold text-sm px-7 py-3 rounded-full">Ver mi pedido <ArrowRight size={16} /></Link>
        <Link href="/catalog" className="inline-flex items-center justify-center gap-2 border-2 border-surface-200 text-gray-600 font-medium text-sm px-7 py-3 rounded-full">Seguir comprando</Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<div className="text-center py-20">Cargando...</div>}><SuccessContent /></Suspense>;
}
