"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bell, Check } from "lucide-react";

/**
 * Captura de email para productos agotados ("Avísame cuando vuelva").
 * El email del cliente se envía como aviso a operaciones (universomerchan7@gmail.com)
 * vía /api/notify-stock. Componente aislado para no tocar la lógica del configurador.
 */
export function StockNotifyForm({ productName, masterCode }: { productName: string; masterCode: string }) {
  const t = useTranslations("Configurator");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setState("error");
      return;
    }
    setState("sending");
    try {
      const r = await fetch("/api/notify-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, productName, masterCode }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 px-4 py-3 rounded-xl">
        <Check size={16} /> {t("notify_success")}
      </div>
    );
  }

  return (
    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="font-bold text-sm text-amber-900 flex items-center gap-2 mb-1">
        <Bell size={15} /> {t("notify_oos_title")}
      </p>
      <p className="text-xs text-amber-800 mb-3">{t("notify_oos_desc")}</p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t("notify_email_placeholder")}
          className="flex-1 min-w-0 px-3 py-2 border border-amber-300 rounded-lg text-sm bg-white outline-none focus:border-amber-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={state === "sending"}
          className="bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-red-dark transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {state === "sending" ? t("notify_sending") : t("notify_button")}
        </button>
      </div>
      {state === "error" && <p className="text-xs text-red-600 mt-2">{t("notify_invalid_email")}</p>}
    </div>
  );
}
