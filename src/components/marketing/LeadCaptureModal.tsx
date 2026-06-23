"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { X, Gift, Check } from "lucide-react";

// Popup de captación de email (exit-intent + timer + scroll), una sola vez por sesión.
// Guarda el lead en el CRM (/api/lead-capture) y muestra el cupón de bienvenida.
const SEEN_KEY = "um_lead_popup_v1";
const SUPPRESS = ["/checkout", "/cart", "/account", "/admin", "/auth"];
const COUPON = "BIENVENIDA5";

export function LeadCaptureModal() {
  const t = useTranslations("Popup");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const armed = useRef(false);

  const suppressed = SUPPRESS.some((s) => pathname?.includes(s));

  useEffect(() => {
    if (suppressed || armed.current) return;
    try {
      if (localStorage.getItem(SEEN_KEY)) return;
    } catch {}
    armed.current = true;

    const show = () => {
      if (document.hidden) return;
      try {
        if (localStorage.getItem(SEEN_KEY)) return;
        localStorage.setItem(SEEN_KEY, "1");
      } catch {}
      setOpen(true);
    };
    const onExit = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };
    const onScroll = () => {
      const h = document.body.scrollHeight;
      if (h > 0 && (window.scrollY + window.innerHeight) / h > 0.55) show();
    };
    const timer = setTimeout(show, 30000);
    document.addEventListener("mouseleave", onExit);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onExit);
      window.removeEventListener("scroll", onScroll);
    };
  }, [suppressed]);

  const close = () => setOpen(false);

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const r = await fetch("/api/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, referer: typeof location !== "undefined" ? location.href : "" }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (!open || suppressed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={close}>
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <button onClick={close} aria-label="Cerrar" className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X size={20} />
        </button>
        {state === "done" ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <Check size={28} className="text-green-600" />
            </div>
            <h3 className="font-display font-extrabold text-2xl mb-2">{t("success_title")}</h3>
            <p className="text-gray-600 mb-4">{t("success_desc")}</p>
            <div className="bg-brand-red/10 border-2 border-dashed border-brand-red rounded-xl py-3 text-brand-red font-extrabold text-2xl tracking-widest">
              {COUPON}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-brand-red/10 flex items-center justify-center mx-auto mb-4">
              <Gift size={28} className="text-brand-red" />
            </div>
            <h3 className="font-display font-extrabold text-2xl mb-2">{t("title")}</h3>
            <p className="text-gray-600 mb-5 leading-relaxed">{t("subtitle")}</p>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === "error") setState("idle");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={t("email_placeholder")}
              className="w-full px-4 py-3 border-2 border-surface-200 rounded-xl text-sm mb-3 outline-none focus:border-brand-red"
            />
            {state === "error" && <p className="text-xs text-red-600 mb-2 -mt-1">{t("invalid_email")}</p>}
            <button
              onClick={submit}
              disabled={state === "sending"}
              className="w-full bg-brand-red text-white py-3 rounded-xl font-bold hover:bg-brand-red-dark transition-colors disabled:opacity-50 mb-3"
            >
              {state === "sending" ? t("sending") : t("button")}
            </button>
            <button onClick={close} className="text-xs text-gray-400 hover:text-gray-600 underline">
              {t("no_thanks")}
            </button>
            <p className="text-[11px] text-gray-400 mt-3">{t("privacy")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
