"use client";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";;
import { useCart } from "@/lib/cart-store";
import { RefreshCw, CheckCircle, XCircle, ShoppingCart } from "lucide-react";
import { Link } from "@/i18n/routing";

function RestoreContent() {
  const t = useTranslations("Cart");
  const searchParams = useSearchParams();
  const router = useRouter();
  const { restoreFromQuote } = useCart();
  const quoteNumber = searchParams.get("quote");
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!quoteNumber) { setStatus("error"); setErrorMsg(t("restore_no_quote")); return; }
    restoreFromQuote(quoteNumber)
      .then(() => { setStatus("success"); setTimeout(() => router.push("/cart"), 2000); })
      .catch((e) => { setStatus("error"); setErrorMsg(e.message || t("restore_error")); });
  }, [quoteNumber, restoreFromQuote, router, t]);

  if (status === "loading") return <div className="max-w-md mx-auto px-4 py-20 text-center"><RefreshCw size={40} className="text-brand-red mx-auto mb-4 animate-spin" /><h1 className="font-display font-extrabold text-2xl">{t("restoring_quote")}</h1></div>;
  if (status === "success") return <div className="max-w-md mx-auto px-4 py-20 text-center"><CheckCircle size={40} className="text-green-500 mx-auto mb-4" /><h1 className="font-display font-extrabold text-2xl mb-4">{t("restored")}</h1><Link href="/cart" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full"><ShoppingCart size={16} /> {t("go_to_cart")}</Link></div>;
  return <div className="max-w-md mx-auto px-4 py-20 text-center"><XCircle size={40} className="text-red-400 mx-auto mb-4" /><h1 className="font-display font-extrabold text-2xl mb-2">{t("restore_failed")}</h1><p className="text-gray-400 text-sm mb-6">{errorMsg}</p><Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-6 py-2.5 rounded-full">{t("explore_catalog")}</Link></div>;
}

export default function CartRestorePage() {
  const t = useTranslations("Cart");
  return <Suspense fallback={<div className="text-center py-20">{t("loading")}</div>}><RestoreContent /></Suspense>;
}
