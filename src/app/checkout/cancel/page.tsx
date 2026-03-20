"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle, ArrowLeft, ShoppingCart } from "lucide-react";

function CancelContent() {
  const searchParams = useSearchParams();
  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><XCircle size={40} className="text-amber-500" /></div>
      <h1 className="font-display font-extrabold text-3xl mb-3">Pago cancelado</h1>
      <p className="text-gray-400 leading-relaxed mb-8">No te preocupes, tu carrito sigue intacto.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/cart" className="inline-flex items-center justify-center gap-2 bg-brand-red text-white font-semibold text-sm px-7 py-3 rounded-full"><ShoppingCart size={16} /> Volver al carrito</Link>
        <Link href="/catalog" className="inline-flex items-center justify-center gap-2 border-2 border-surface-200 text-gray-600 font-medium text-sm px-7 py-3 rounded-full"><ArrowLeft size={16} /> Seguir comprando</Link>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return <Suspense fallback={<div className="text-center py-20">Cargando...</div>}><CancelContent /></Suspense>;
}
