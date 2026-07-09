import { getTranslations, getLocale } from "next-intl/server";
import { alternatesFor, ogLocale, localeUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { getMagazineData } from "@/lib/catalog-magazine";
import { CatalogFlipbook } from "@/components/catalog/CatalogFlipbook";

// El catálogo lee productos en vivo: revalidamos cada hora.
export const revalidate = 3600;

export async function generateMetadata() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Magazine" });
  const title = t("meta_title");
  const description = t("meta_description");
  return {
    title,
    description,
    alternates: alternatesFor(locale, "/catalogo"),
    openGraph: {
      title,
      description,
      url: localeUrl(locale, "/catalogo"),
      type: "website",
      locale: ogLocale(locale),
      images: [DEFAULT_OG_IMAGE],
    },
  };
}

export default async function CatalogoMagazinePage() {
  const t = await getTranslations("Magazine");
  const data = await getMagazineData();
  const year = new Date().getFullYear();

  const labels = {
    title: t("title"),
    tagline: t("tagline"),
    swipeHint: t("swipe_hint"),
    downloadCta: t("download_cta"),
    from: t("from"),
    view: t("view"),
    products: t("products"),
    page: t("page"),
    of: t("of"),
    backTitle: t("back_title"),
    backText: t("back_text"),
    backCta: t("back_cta"),
    europe: t("europe"),
  };

  return (
    <div className="bg-gradient-to-b from-surface-50 to-white min-h-screen py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 text-center mb-8">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900 mb-2">{t("title")}</h1>
        <p className="text-gray-600 text-sm sm:text-base">{t("intro")}</p>
      </div>

      {data.categories.length > 0 ? (
        <CatalogFlipbook data={data} labels={labels} year={year} />
      ) : (
        <p className="text-center text-gray-500 py-20">{t("empty")}</p>
      )}
    </div>
  );
}
