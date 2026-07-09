// ============================================================
// UNIVERSO MERCHAN — Catálogo "Revista" (Flipbook) — Builder de datos
// ============================================================
// Construye el contenido del catálogo branded a partir de los
// productos REALES en BD (siempre actualizado): categorías +
// productos por categoría con precio "Desde X€" (ya con margen).
//
// Lo usan tanto la página flipbook (/[locale]/catalogo) como el
// generador de PDF (/api/catalog/pdf). NO expone Midocean: solo
// nombre, imagen, código propio (masterCode) y precio de venta UM.
// ============================================================

import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import { adminSettings, coupons } from "@/lib/schema";
import { getCategories, getProductList } from "@/lib/catalog-api";

// Productos máximos por categoría en la revista (amplio pero manejable).
export const MAGAZINE_PRODUCTS_PER_CATEGORY = 12;
// Productos por categoría en el PDF descargable (más ligero que el online).
export const PDF_PRODUCTS_PER_CATEGORY = 8;

// Cupón de primer pedido por defecto (configurable en admin_settings → "catalog_lead_coupon").
export const DEFAULT_CATALOG_COUPON = "CATALOGO10";

export interface MagazineProduct {
  name: string;
  masterCode: string;
  category: string;
  image: string;
  startingPrice: string;     // "Desde 6.75€" → aquí solo "6,75€"
  startingPriceRaw: number;
}

export interface MagazineCategory {
  name: string;          // canonical (es)
  displayName: string;   // etiqueta localizada
  slug: string;
  productCount: number;  // total real en la categoría
  products: MagazineProduct[];
}

export interface MagazineData {
  categories: MagazineCategory[];
  totalProducts: number;
}

/**
 * Construye el catálogo agrupado por categorías.
 * @param perCategory  nº de productos a incluir por categoría
 */
export async function getMagazineData(
  perCategory: number = MAGAZINE_PRODUCTS_PER_CATEGORY
): Promise<MagazineData> {
  const categories = await getCategories();

  // Pedimos productos de cada categoría en paralelo, ordenados por stock
  // (los que mejor se ven y están disponibles primero).
  const sections = await Promise.all(
    categories.map(async (cat) => {
      const { products } = await getProductList({
        category: cat.name,
        sort: "stock",
        limit: perCategory * 2, // pedimos de más para descartar los sin imagen
      });

      const withImage = products
        .filter((p) => p.mainImage)
        .slice(0, perCategory)
        .map<MagazineProduct>((p) => ({
          name: p.name,
          masterCode: p.masterCode,
          category: p.category,
          image: p.mainImage,
          startingPrice: p.startingPrice,
          startingPriceRaw: p.startingPriceRaw,
        }));

      return {
        name: cat.name,
        displayName: cat.displayName || cat.name,
        slug: cat.slug,
        productCount: cat.productCount,
        products: withImage,
      } as MagazineCategory;
    })
  );

  // Solo categorías que tengan al menos 1 producto con imagen.
  const filtered = sections.filter((s) => s.products.length > 0);
  const totalProducts = categories.reduce((acc, c) => acc + (c.productCount || 0), 0);

  return { categories: filtered, totalProducts };
}

/** Lee el código de cupón de primer pedido configurado (o el por defecto). */
export async function getCatalogCouponCode(): Promise<string> {
  try {
    const row = await db.query.adminSettings.findFirst({
      where: eq(adminSettings.key, "catalog_lead_coupon"),
    });
    const v = row?.value?.trim();
    return v && v.length > 0 ? v.toUpperCase() : DEFAULT_CATALOG_COUPON;
  } catch {
    return DEFAULT_CATALOG_COUPON;
  }
}

/**
 * Garantiza que el cupón de primer pedido existe y está activo.
 * Idempotente: si ya existe no lo toca (Marina puede editarlo/desactivarlo
 * desde /admin/coupons). Si no existe, lo crea al 10%.
 * Devuelve el código a comunicar al lead.
 */
export async function ensureCatalogCoupon(): Promise<string> {
  const code = await getCatalogCouponCode();
  try {
    const existing = await db.query.coupons.findFirst({
      where: eq(coupons.code, code),
    });
    if (!existing) {
      await db.insert(coupons).values({
        code,
        discountType: "percentage",
        discountValue: "10",
        isActive: true,
      });
    }
  } catch (e) {
    // Si falla la creación (p.ej. carrera), seguimos: el código se comunica igual.
    console.error("[catalog-magazine] ensureCatalogCoupon:", (e as any)?.message);
  }
  return code;
}
