"use client";

import { useTranslations } from "next-intl";
import { Truck } from "lucide-react";
import { LocaleSwitcher } from "./LocaleSwitcher";

// Thin utility bar: "we ship across Europe" message (left) + language selector (right).
export function TopBar() {
  const t = useTranslations("Header");
  return (
    <div className="bg-gray-900 text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-8 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-medium">
          <Truck size={13} className="text-brand-red shrink-0" />
          <span>{t("ships_europe")}</span>
          <span aria-hidden="true">🇪🇺</span>
        </span>
        <LocaleSwitcher />
      </div>
    </div>
  );
}
