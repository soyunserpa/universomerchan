// ============================================================
// SEO helpers — hreflang, canonical y URLs por idioma (multi-país EU)
// ------------------------------------------------------------
// Estructura de URLs (next-intl, localePrefix "as-needed", defaultLocale "es"):
//   ES  → https://universomerchan.com{path}          (SIN prefijo)
//   otro→ https://universomerchan.com/{locale}{path} (con prefijo /en, /fr, ...)
//
// Cada página debe declarar:
//   - canonical AUTO-REFERENTE a su propia URL de idioma
//   - hreflang a TODAS las versiones de idioma + x-default
// Leer el campo equivocado (ej. canonical fijo a la URL ES) hace que Google
// descarte las versiones traducidas. Por eso centralizamos aquí.
// ============================================================

export const SEO_LOCALES = ["es", "en", "fr", "de", "it", "pt", "nl"] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];
export const DEFAULT_LOCALE: SeoLocale = "es";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com").replace(/\/$/, "");

// path va SIN prefijo de idioma: "" o "/" para home, "/catalog", "/product/abc", etc.
export function localeUrl(locale: string, path: string = ""): string {
  const clean = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return locale === DEFAULT_LOCALE ? `${SITE_URL}${clean}` : `${SITE_URL}/${locale}${clean}`;
}

// Objeto `alternates` para Next Metadata: canonical auto-referente + hreflang de todos los idiomas + x-default.
export function alternatesFor(locale: string, path: string = "") {
  const languages: Record<string, string> = {};
  for (const loc of SEO_LOCALES) languages[loc] = localeUrl(loc, path);
  languages["x-default"] = localeUrl(DEFAULT_LOCALE, path);
  return {
    canonical: localeUrl(locale, path),
    languages,
  };
}

// Código de locale para Open Graph (og:locale) por idioma → país europeo principal.
const OG_LOCALES: Record<string, string> = {
  es: "es_ES", en: "en_GB", fr: "fr_FR", de: "de_DE", it: "it_IT", pt: "pt_PT", nl: "nl_NL",
};
export function ogLocale(locale: string): string {
  return OG_LOCALES[locale] || "es_ES";
}
export function ogAlternateLocales(locale: string): string[] {
  return SEO_LOCALES.filter((l) => l !== locale).map((l) => ogLocale(l));
}

// Idiomas humanos para JSON-LD availableLanguage / inLanguage.
export const SCHEMA_LANGUAGES = ["Spanish", "English", "French", "German", "Italian", "Portuguese", "Dutch"];
const BCP47: Record<string, string> = {
  es: "es-ES", en: "en-GB", fr: "fr-FR", de: "de-DE", it: "it-IT", pt: "pt-PT", nl: "nl-NL",
};
export function bcp47(locale: string): string {
  return BCP47[locale] || "es-ES";
}

// Imagen OG por defecto (absoluta).
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/about-us-hero-new.webp`;
