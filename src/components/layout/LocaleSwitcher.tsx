"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";

const LOCALES = [
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "de", flag: "🇩🇪", label: "DE" },
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "pt", flag: "🇵🇹", label: "PT" },
  { code: "nl", flag: "🇳🇱", label: "NL" },
];

// Manual language selector. Auto-detection (device language) still applies on first
// visit; this lets the user override it, keeping the same page + query (filters, etc.).
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("Header");

  const change = (newLocale: string) => {
    const query = Object.fromEntries(searchParams.entries());
    router.replace({ pathname, query }, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-1">
      <Globe size={13} className="opacity-70" />
      <select
        value={locale}
        onChange={(e) => change(e.target.value)}
        aria-label={t("choose_language")}
        className="bg-transparent text-white text-xs font-semibold border-none outline-none cursor-pointer focus:ring-0 py-0"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} className="text-gray-900">
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}
