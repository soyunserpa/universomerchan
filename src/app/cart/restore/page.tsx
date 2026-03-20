"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { RefreshCw, CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";

function RestoreContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { restoreFromQuote } = useCart();
  const quoteNumber = searchParams.get("quote");
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!quoteNumber) { setStatus("error"); setErrorMsg("No se ha indicado un presupuesto"); return; }
    restoreFromQuote(quoteNumber)
      .then(() => { setStatus("success"); setTimeout(() => router.push("/cart"), 2000); })
      .catch((e) => { setStatus("error"); setErrorMsg(e.message || "Error al restaurar"); });
  }, [quoteNumber, restoreFromQuote, router]);

  if (status === "loading") return <div className="max-w-md mx-auto px-4 py-20 text-center"><RefreshCw size={40} className="text-brand-red mx-auto mb-4 animate-spin" /><h1 className="font-display font-extrabold text-2xl">Restaurando presupuesto...</h1></div>;
  if (status === "success") return <div className="max-w-md mx-auto px-4 py-20 text-center"><CheckCircle size={40} className="text-green-500 mx-auto mb-4" /><h1 className="font-display font-extrabold text-2xl mb-4">¡Restaurado!</h1><Link href="/cart" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full"><ShoppingCart size={16} /> Ir al carrito</Link></div>;
  return <div className="max-w-md mx-auto px-4 py-20 text-center"><XCircle size={40} className="text-red-400 mx-auto mb-4" /><h1 className="font-display font-extrabold text-2xl mb-2">No se pudo restaurar</h1><p className="text-gray-400 text-sm mb-6">{errorMsg}</p><Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full">Explorar catálogo</Link></div>;
}

export default function CartRestorePage() {
  return <Suspense fallback={<div className="text-center py-20">Cargando...</div>}><RestoreContent /></Suspense>;
}
