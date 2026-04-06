// ============================================================
// UNIVERSO MERCHAN — Catalog API Routes
// ============================================================
// These are the Next.js API routes that the frontend calls.
// They read from the local PostgreSQL (synced from Midocean)
// and apply margins before returning data to the browser.
// ============================================================

// ── /api/catalog/products ────────────────────────────────────
// GET — List products with filters, pagination, search
// Query params: ?category=&search=&page=1&limit=24&sort=name

import { db } from "@/lib/database";
import { eq, and, like, sql, desc, asc, ilike, or, exists } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { getStartingPrice, formatPriceShort } from "@/lib/price-calculator";

// Default margins (loaded from admin_settings on startup, cached in Redis)

// Helper: safely parse JSONB that may be double-encoded
function safeParseJsonArray(val: any): any[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return []; }
  }
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { val = JSON.parse(val); } catch { return []; }
  }
  if (Array.isArray(val)) return val;
  return [];
}

const DEFAULT_MARGINS = {
  productMarginPct: 40,
  printMarginPct: 50,
};

// ============================================================
// GET /api/catalog/products
// ============================================================

export interface CatalogProductResponse {
  id: number;
  masterCode: string;
  name: string;
  shortDescription: string;
  material: string;
  dimensions: string;
  category: string;
  categoryLevel2: string;
  isGreen: boolean;
  printable: boolean;
  startingPrice: string;     // "Desde 6.75€" (already with margin applied)
  startingPriceRaw: number;
  totalStock: number;
  variants: Array<{
    sku: string;
    color: string;
    colorGroup: string;
    colorCode: string;
    colorHex: string;        // Derived from PMS or color_group
    size?: string;
    stock: number;
    mainImage: string;
    mainImageHiRes: string;
    images: Array<{
      url: string;
      urlHiRes: string;
      subtype: string;
    }>;
  }>;
  numberOfPrintPositions: number;
  mainImage: string;
}

export async function getProductList(params: {
  category?: string;
  subcategory?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "price_asc" | "price_desc" | "newest" | "stock";
  greenOnly?: boolean;
  color?: string;
}): Promise<{ products: CatalogProductResponse[]; total: number; pages: number }> {
  const { category, subcategory, search, page = 1, limit = 24, sort = "name", greenOnly, color } = params;

  // Build where conditions
  const conditions = [eq(schema.products.isVisible, true)];

  if (category && category !== "Todos") {
    conditions.push(eq(schema.products.categoryLevel1, category));
  }

  if (subcategory && subcategory !== "Todas") {
    conditions.push(eq(schema.products.categoryLevel2, subcategory));
  }
  
  if (search) {
    const terms = search.trim().split(/\s+/);
    for (const term of terms) {
      if (!term) continue;
      conditions.push(
        or(
          ilike(schema.products.productName, `%${term}%`),
          ilike(schema.products.shortDescription, `%${term}%`),
          ilike(schema.products.longDescription, `%${term}%`),
          ilike(schema.products.categoryLevel1, `%${term}%`),
          ilike(schema.products.categoryLevel2, `%${term}%`),
          ilike(schema.products.masterCode, `%${term}%`),
          ilike(schema.products.material, `%${term}%`),
        )!
      );
    }
  }
  
  if (greenOnly) {
    conditions.push(eq(schema.products.isGreen, true));
  }

  if (color && color !== "Todos") {
    // Map Spanish generic colors to common English tags used by Midocean
    const cLow = color.toLowerCase();
    const colorMap: Record<string, string[]> = {
      negro: ["black", "negro", "noir", "schwarz"],
      blanco: ["white", "blanco", "off white", "ivory", "transparent", "transparente", "clear", "blanc", "weiss"],
      azul: ["blue", "azul", "navy", "cyan", "aqua", "celeste", "denim", "cobalt", "royal", "bleu", "blau", "marino"],
      rojo: ["red", "rojo", "burgundy", "crimson", "maroon", "granate", "rouge", "rot", "burdeos", "wine", "vino"],
      verde: ["green", "verde", "lime", "mint", "olive", "khaki", "kaki", "caqui", "vert", "grün"],
      amarillo: ["yellow", "amarillo", "gold", "limon", "limón", "mustard", "mostaza", "jaune", "gelb"],
      naranja: ["orange", "naranja", "terracota", "peach", "melocoton", "melocotón"],
      rosa: ["pink", "rosa", "fuchsia", "magenta", "fucsia", "rose", "coral", "salmon"],
      morado: ["purple", "morado", "violet", "lila", "plum", "púrpura", "purpura", "mauve"],
      gris: ["grey", "gray", "gris", "silver", "plata", "antracita", "ash", "ceniza", "titanio"],
      madera: ["natural", "wood", "madera", "bamboo", "cork", "corcho", "bambu", "bambú", "kraft"],
      marron: ["brown", "marron", "marrón", "chocolate", "coffee", "sand", "beige", "arena", "camel", "brun", "braun"],
    };
    
    // We normalize the search terms slightly by splitting out compound names if we want,
    // but Midocean usually works with exact substring matches inside colorGroup or colorDescription.
    const terms = colorMap[cLow] || [cLow, cLow.normalize("NFD").replace(/[\u0300-\u036f]/g, "")];
    
    const colorOrs = terms.flatMap(term => [
      ilike(schema.productVariants.colorGroup, `%${term}%`),
      ilike(schema.productVariants.colorDescription, `%${term}%`)
    ]);

    conditions.push(
      exists(
        db.select({ id: schema.productVariants.id })
          .from(schema.productVariants)
          .where(
            and(
              eq(schema.productVariants.productId, schema.products.id),
              or(...colorOrs)
            )
          )
      )
    );
  }

  // Count total
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.products)
    .where(and(...conditions));
  const total = Number(countResult[0].count);

  // Sort
  let orderBy;
  switch (sort) {
    case "price_asc": orderBy = asc(schema.products.masterCode); break; // Will sort by price after
    case "price_desc": orderBy = desc(schema.products.masterCode); break;
    case "newest": orderBy = desc(schema.products.createdAt); break;
    case "stock": orderBy = desc(schema.products.masterCode); break;
    default: orderBy = asc(schema.products.productName);
  }

  // Fetch products
  const offset = (page - 1) * limit;
  const products = await db.query.products.findMany({
    where: and(...conditions),
    limit,
    offset,
    orderBy: [orderBy],
  });

  // Enrich with variants, stock, and prices
  const enriched: CatalogProductResponse[] = [];
  
  for (const product of products) {
    // Get variants
    const variants = await db.query.productVariants.findMany({
      where: eq(schema.productVariants.productId, product.id),
    });

    // Get stock for each variant
    const variantsWithStock = [];
    let totalStock = 0;
    
    for (const variant of variants) {
      const stockEntry = await db.query.stock.findFirst({
        where: eq(schema.stock.sku, variant.sku),
      });
      const qty = stockEntry?.quantity || 0;
      totalStock += qty;
      
      // Extract main image
      const assets = safeParseJsonArray(variant.digitalAssets);
      const frontImage = assets.find((a: any) => a.subtype === "item_picture_front");
      
      // Extract ALL images for the product gallery
      const allImages = assets
        .filter((a: any) => a.subtype?.startsWith("item_picture") || a.subtype?.startsWith("item_lifestyle") || a.type === "image")
        .map((a: any) => ({
          url: a.url || "",
          urlHiRes: a.url_highress || a.url || "",
          subtype: a.subtype || "item_picture",
        }));
      
      variantsWithStock.push({
        sku: variant.sku,
        color: variant.colorDescription || "",
        colorGroup: variant.colorGroup || "",
        colorCode: variant.colorCode || "",
        colorHex: colorGroupToHex(variant.colorDescription || variant.colorGroup || ""),
        size: variant.size || undefined,
        stock: qty,
        mainImage: frontImage?.url || "",
        mainImageHiRes: frontImage?.url_highress || frontImage?.url || "",
        images: allImages,
      });
    }

    // Get price scales
    const priceEntry = await db.query.productPrices.findFirst({
      where: eq(schema.productPrices.masterCode, product.masterCode),
    });
    
    const priceScales = safeParseJsonArray(priceEntry?.priceScales).map((s: any) => ({
      minimumQuantity: parseInt(s.minimum_quantity),
      costPrice: typeof s.price === "string" ? parseFloat(s.price.replace(",", ".")) : Number(s.price || 0),
    }));

    // Use custom price if admin set one, otherwise calculate from Midocean
    const startingPriceRaw = product.customPrice 
      ? parseFloat(product.customPrice.toString())
      : getStartingPrice(priceScales, DEFAULT_MARGINS.productMarginPct);

    // Main image from first variant
    const mainImage = variantsWithStock[0]?.mainImage || "";

    enriched.push({
      id: product.id,
      masterCode: product.masterCode,
      name: product.productName,
      shortDescription: product.shortDescription || "",
      material: product.material || "",
      dimensions: product.dimensions || "",
      category: product.categoryLevel1 || "",
      categoryLevel2: product.categoryLevel2 || "",
      isGreen: product.isGreen || false,
      printable: product.printable || false,
      startingPrice: formatPriceShort(startingPriceRaw),
      startingPriceRaw,
      totalStock,
      variants: variantsWithStock,
      numberOfPrintPositions: product.numberOfPrintPositions || 0,
      mainImage,
    });
  }

  // Sort by price if needed (had to do it after enrichment)
  if (sort === "price_asc") {
    enriched.sort((a, b) => a.startingPriceRaw - b.startingPriceRaw);
  } else if (sort === "price_desc") {
    enriched.sort((a, b) => b.startingPriceRaw - a.startingPriceRaw);
  } else if (sort === "stock") {
    enriched.sort((a, b) => b.totalStock - a.totalStock);
  }

  return {
    products: enriched,
    total,
    pages: Math.ceil(total / limit),
  };
}

// ============================================================
// GET /api/catalog/products/[masterCode]
// Full product detail with print positions and pricing
// ============================================================

export interface ProductDetailResponse extends CatalogProductResponse {
  longDescription: string;
  brand: string;
  countryOfOrigin: string;
  documents: Array<{ url: string; type: string; subtype: string }>;
  priceScales: Array<{
    minQuantity: number;
    pricePerUnit: string;    // Already with product margin
    pricePerUnitRaw: number;
  }>;
  // Per-variant pricing (keyed by SKU) — for textiles with different prices per size
  variantPrices: Record<string, {
    price: number;           // Midocean cost price (no margin)
    priceSell: number;       // With product margin applied
    scales?: Array<{
      minQuantity: number;
      price: number;         // Cost
      priceSell: number;     // With margin
    }>;
  }>;
  // Whether this product has size variants (textile)
  hasSize: boolean;
  printPositions: Array<{
    positionId: string;
    description: string;
    maxWidth: number;        // mm
    maxHeight: number;       // mm
    positionImage?: string;
    // ── Canvas Editor V2 fields ──────────────────────────────
    positionImageBlank?: string;   // Product photo WITHOUT print area overlay
    points?: Array<{               // Print zone coordinates on reference image
      distance_from_left: number;
      distance_from_top: number;
      sequence_no: number;
    }>;
    // ─────────────────────────────────────────────────────────
    techniques: Array<{
      techniqueId: string;
      name: string;
      description: string;
      pricingType: string;
      maxColors?: number;
      // Real pricing from Midocean print_prices table
      pricing?: {
        setup: number;           // Setup cost (€) - per color for NumberOfColours, per position for NumberOfPositions
        setupRepeat: number;     // Setup cost for repeat orders
        nextColourCostIndicator: boolean;  // If true, next_price applies for 2nd+ colors
        varCosts: Array<{
          rangeId: string;
          areaFrom: number;
          areaTo: number;
          scales: Array<{
            minimumQuantity: number;
            price: number;          // Cost per unit (1st color/position)
            nextPrice: number;      // Cost per unit (2nd+ color, if applicable)
          }>;
        }>;
      };
    }>;
    // Handling cost info for this product
    handlingInfo?: {
      code: string;              // A, B, C, D, E, Z
      description: string;
      pricePerUnit: number;      // Cost in € per unit
    };
  }>;
}

export async function getProductDetail(masterCode: string): Promise<ProductDetailResponse | null> {
  const product = await db.query.products.findFirst({
    where: and(
      eq(schema.products.masterCode, masterCode),
      eq(schema.products.isVisible, true),
    ),
  });

  if (!product) return null;

  // Get base catalog data
  const catalogData = await getProductList({ search: masterCode, limit: 1 });
  if (!catalogData.products.length) return null;
  const base = catalogData.products[0];

  // Get price scales with margin applied
  const priceEntry = await db.query.productPrices.findFirst({
    where: eq(schema.productPrices.masterCode, masterCode),
  });
  
  const priceScales = safeParseJsonArray(priceEntry?.priceScales).map((s: any) => {
    const cost = typeof s.price === "string" ? parseFloat(s.price.replace(",", ".")) : Number(s.price || 0);
    const sell = cost * (1 + DEFAULT_MARGINS.productMarginPct / 100);
    return {
      minQuantity: parseInt(s.minimum_quantity),
      pricePerUnit: formatPriceShort(sell),
      pricePerUnitRaw: Math.round(sell * 100) / 100,
    };
  });

  // Get print positions (using raw SQL to include canvas V2 columns)
  const printPositionsRaw = await db.execute(
    sql`SELECT *, position_image_blank, position_image_variants, position_points::text as position_points_json
         FROM print_positions WHERE master_code = ${masterCode}`
  );
  const printPositionsData = (printPositionsRaw as any).rows || printPositionsRaw;

  // Fetch real pricing data for all techniques
  const allTechniqueIds = new Set<string>();
  for (const pos of printPositionsData) {
    let techs = pos.available_techniques || []; if (typeof techs === 'string') { techs = JSON.parse(techs); } if (typeof techs === 'string') { techs = JSON.parse(techs); } if (!Array.isArray(techs)) { techs = []; }
    for (const t of techs) {
      allTechniqueIds.add(t.technique_id || t.id);
    }
  }
  
  // Get print prices from DB
  const printPricesData: Record<string, any> = {};
  if (allTechniqueIds.size > 0) {
    const techIds = Array.from(allTechniqueIds);
    const priceRows = await db.execute(
      sql`SELECT technique_id, pricing_type, setup, setup_repeat, next_colour_cost_indicator, var_costs::text as var_costs_json FROM print_prices WHERE technique_id IN (${sql.join(techIds.map(id => sql`${id}`), sql`, `)})`
    );
    for (const row of ((priceRows as any).rows || priceRows)) {
      printPricesData[row.technique_id] = row;
    }
  }

  // Get handling info for this product (print_manipulation NOT in Drizzle schema — raw SQL)
  let handlingInfo: { code: string; description: string; pricePerUnit: number } | undefined;
  const manipCodeResult = await db.execute(
    sql`SELECT print_manipulation FROM products WHERE master_code = ${masterCode} LIMIT 1`
  );
  const productManipCode = ((manipCodeResult as any).rows || manipCodeResult)?.[0]?.print_manipulation;
  if (productManipCode) {
    const manipRow = await db.execute(
      sql`SELECT handling_price_scales::text as data FROM print_manipulations WHERE master_code = ${productManipCode}`
    );
    const manipData = ((manipRow as any).rows || manipRow)?.[0];
    if (manipData?.data) {
      const parsed = typeof manipData.data === 'string' ? JSON.parse(manipData.data) : manipData.data;
      handlingInfo = {
        code: productManipCode,
        description: parsed.description || productManipCode,
        pricePerUnit: typeof parsed.price_per_unit === 'number' ? parsed.price_per_unit : parseFloat(parsed.price_per_unit || '0'),
      };
    }
  }

  const printPositions = printPositionsData.map((pos: any) => ({
    positionId: pos.position_id,
    description: pos.position_description || pos.position_id,
    maxWidth: parseFloat(pos.max_print_width?.toString() || "0"),
    maxHeight: parseFloat(pos.max_print_height?.toString() || "0"),
    positionImage: pos.print_position_image || undefined,
    positionImageBlank: pos.position_image_blank || undefined,
    imageVariants: safeParseJsonArray(pos.position_image_variants),
    points: pos.position_points_json ? JSON.parse(pos.position_points_json) : undefined,
    techniques: ((() => { let at = pos.available_techniques || []; if (typeof at === 'string') { at = JSON.parse(at); } if (typeof at === 'string') { at = JSON.parse(at); } return Array.isArray(at) ? at : []; })() as any[]).map((t: any) => ({
      techniqueId: t.technique_id || t.id,
      name: t.technique_description || t.technique_id || t.id,
      description: getTechniqueDescription(t.technique_id || t.id, t.technique_description || t.technique_name || t.technique_id || t.id),
      pricingType: getTechniquePricingType(t.technique_id || t.id),
      maxColors: t.max_number_of_colors ? parseInt(t.max_number_of_colors) : (t.max_colours ? parseInt(t.max_colours) : undefined),
      pricing: (() => {
        const techId = t.technique_id || t.id;
        const priceData = printPricesData[techId];
        if (!priceData) return undefined;
        const parseEU = (v: any) => {
          if (!v || v === '') return 0;
          if (typeof v === 'number') return v;
          return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0;
        };
        let varCosts: any[] = safeParseJsonArray(priceData.var_costs_json || priceData.var_costs);
        return {
          setup: parseFloat(priceData.setup?.toString() || '0'),
          setupRepeat: parseFloat(priceData.setup_repeat?.toString() || '0'),
          nextColourCostIndicator: priceData.next_colour_cost_indicator === true || priceData.next_colour_cost_indicator === 't',
          varCosts: varCosts.map((vc: any) => ({
            rangeId: vc.range_id || '',
            areaFrom: parseEU(vc.area_from),
            areaTo: parseEU(vc.area_to),
            scales: (vc.scales || []).map((s: any) => ({
              minimumQuantity: parseEU(s.minimum_quantity),
              price: parseEU(s.price),
              nextPrice: parseEU(s.next_price),
            })),
          })),
        };
      })(),
    })),
    handlingInfo,
  }));

  // Documents
  const documents = safeParseJsonArray(product.digitalAssets).filter(
    (a: any) => a.type === "document"
  );

  // ── Per-variant pricing from variant_prices table ──────────
  const variantPrices: Record<string, {
    price: number;
    priceSell: number;
    scales?: Array<{ minQuantity: number; price: number; priceSell: number }>;
  }> = {};

  try {
    const vpRows = await db.execute(
      sql`SELECT sku, price, price_scales::text as scales_json FROM variant_prices WHERE master_code = ${masterCode}`
    );
    const margin = 1 + DEFAULT_MARGINS.productMarginPct / 100;
    for (const row of ((vpRows as any).rows || vpRows) as any[]) {
      const cost = parseFloat(row.price?.toString() || "0");
      const sell = Math.round(cost * margin * 100) / 100;
      let scales: Array<{ minQuantity: number; price: number; priceSell: number }> | undefined;
      if (row.scales_json) {
        try {
          const parsed = JSON.parse(row.scales_json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            scales = parsed.map((s: any) => ({
              minQuantity: parseInt(s.minimum_quantity) || 1,
              price: typeof s.price === "number" ? s.price : parseFloat(s.price || "0"),
              priceSell: Math.round((typeof s.price === "number" ? s.price : parseFloat(s.price || "0")) * margin * 100) / 100,
            }));
          }
        } catch { /* ignore parse errors */ }
      }
      variantPrices[row.sku] = { price: cost, priceSell: sell, scales };
    }
  } catch (e: any) {
    // variant_prices table might not exist yet — fall back gracefully
    console.warn("[catalog-api] variant_prices query failed:", e.message);
  }

  // Detect if product has size variants (textile)
  const hasSize = base.variants.some(v => !!v.size);

  return {
    ...base,
    longDescription: product.longDescription || "",
    brand: product.brand || "",
    countryOfOrigin: product.countryOfOrigin || "",
    documents,
    priceScales,
    variantPrices,
    hasSize,
    printPositions,
  };
}

// ============================================================
// GET /api/catalog/categories
// Returns all unique categories with product counts
// ============================================================

export interface CategoryResponse {
  name: string;
  slug: string;
  productCount: number;
}

export async function getCategories(): Promise<CategoryResponse[]> {
  const result = await db
    .select({
      category: schema.products.categoryLevel1,
      count: sql<number>`count(*)`,
    })
    .from(schema.products)
    .where(eq(schema.products.isVisible, true))
    .groupBy(schema.products.categoryLevel1)
    .orderBy(desc(sql`count(*)`));

  return result
    .filter(r => r.category)
    .map(r => ({
      name: r.category!,
      slug: slugify(r.category!),
      productCount: Number(r.count),
    }));
}

// ============================================================
// GET /api/catalog/subcategories?category=X
// Returns level 2 subcategories for a given level 1 category
// ============================================================

export async function getSubcategories(category: string): Promise<CategoryResponse[]> {
  const conditions = [
    eq(schema.products.isVisible, true),
    eq(schema.products.categoryLevel1, category),
  ];

  const result = await db
    .select({
      category: schema.products.categoryLevel2,
      count: sql<number>`count(*)`,
    })
    .from(schema.products)
    .where(and(...conditions))
    .groupBy(schema.products.categoryLevel2)
    .orderBy(desc(sql`count(*)`));

  return result
    .filter(r => r.category)
    .map(r => ({
      name: r.category!,
      slug: slugify(r.category!),
      productCount: Number(r.count),
    }));
}

// ============================================================
// POST /api/catalog/calculate-price
// Real-time price calculation for the configurator
// ============================================================

export interface PriceCalculationRequest {
  masterCode: string;
  quantity: number;
  printConfig?: {
    techniqueId: string;
    positionId: string;
    numColors: number;
    printWidthMm: number;
    printHeightMm: number;
    isRepeatOrder?: boolean;
  };
  clientId?: number;  // For per-client discount
}

// This endpoint will call calculateFullPrice from price-calculator.ts
// and return the complete breakdown for the frontend configurator

// ============================================================
// HELPERS
// ============================================================

function colorGroupToHex(colorGroup: string): string {
  if (!colorGroup || typeof colorGroup !== 'string') return "#9CA3AF";

  const map: Record<string, string> = {
    // English
    black: "#222222", white: "#F8F8F8", blue: "#1E40AF", red: "#DC2626",
    green: "#15803D", yellow: "#EAB308", orange: "#EA580C", pink: "#EC4899",
    purple: "#7C3AED", grey: "#6B7280", gray: "#6B7280", brown: "#78350F",
    navy: "#1E3A5F", silver: "#C0C0C0", gold: "#D4A017", natural: "#F5F0E6",
    beige: "#F5F5DC", transparent: "#E8E8E8", mixed: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)",
    // Spanish Standard
    negro: "#222222", blanco: "#F8F8F8", azul: "#1E40AF", rojo: "#DC2626",
    verde: "#15803D", amarillo: "#EAB308", naranja: "#EA580C", rosa: "#EC4899",
    morado: "#7C3AED", purpura: "#7C3AED", gris: "#6B7280", marron: "#78350F",
    marino: "#1E3A5F", plata: "#C0C0C0", oro: "#D4A017", dorado: "#D4A017",
    transparente: "#E8E8E8", mixto: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)",
    mezclado: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)",
    // Midocean specifics
    ceniza: "#D1D5DB", azul_claro: "#60A5FA", azul_oscuro: "#1E3A8A",
    azul_rey: "#2563EB", azul_marino: "#1E3A8A", celeste: "#38BDF8",
    verde_claro: "#86EFAC", verde_oscuro: "#064E3B", verde_manzana: "#84CC16",
    verde_lima: "#A3E635", naranja_claro: "#FDBA74", burdeos: "#9F1239",
    fucsia: "#C026D3", turquesa: "#0D9488", amarillo_fluor: "#D9F99D",
    verde_fluor: "#86EFAC", naranja_fluor: "#FFEDD5", rosa_fluor: "#FBCFE8",
    naranja_neon: "#F97316", verde_neon: "#86EFAC", rosa_neon: "#FBCFE8", amarillo_neon: "#D9F99D",
    neon: "#A855F7",
    azul_real: "#1D4ED8", lima: "#A3E635", marino_frances: "#1E3A8A", francia: "#1E3A8A",
    cuerda: "#D2B48C", aqua: "#00FFFF", dark_blue: "#00008B", frozen_green: "#A8E4A0",
    caqui_oscuro: "#BDB76B", denim: "#1560BD", madera: "#8B5A2B", french_marino: "#1E3A8A",
    creamy_green: "#E8F4E5", antracita_mezcla: "#383E42", fuchsia: "#FF00FF", limon: "#FDE910",
    astral_purple: "#5D3FD3", french_navy: "#1E3A8A", medium_pink: "#FFB6C1", apple_green: "#8DB600",
    lila: "#C8A2C8", burgundy: "#800020", army: "#4B5320", ribbon_pink: "#FFC0CB",
    linen_twin: "#FAF0E6", beig: "#F5F5DC", marfil: "#FFFFF0", kaki: "#C3B091", caqui: "#C3B091",
    folk_pink_twin: "#FF69B4", forest_green: "#228B22", violeta_transparente: "#EE82EE",
    pool_blue: "#00BFFF", hibisco: "#B43757", violeta: "#EE82EE", folk_red_twin: "#FF0000",
    sand: "#C2B280", flannel_grey: "#7B8997", tilo: "#98FB98", ice_blue: "#AEEEEE",
    pop_orange: "#FF4F00", terracota: "#E2725B", chocolate: "#D2691E", denim_jaspeado: "#4682B4",
    petroleo: "#005F6A", ocre: "#CC7722", ultramarino: "#120A8F", chili_red: "#E23D28",
    heather_light_green: "#90EE90", deep_charcoal_grey: "#2E3B4E", abyss_blue: "#0F204B",
    oxblood: "#4A0000", tierra: "#D2B48C", royal: "#4169E1", dark_grey: "#A9A9A9",
    titanio: "#878681", melocoton: "#FFDAB9", albaricoque: "#FBCEB1", heather_beige: "#F5F5DC",
    tilo_fluor: "#B2FF66", esmeralda: "#50C878", zinc: "#7D8081", charcoal_grey: "#36454F",
    cream: "#FFFDD0", metal_grey: "#A8A9AD", caqui_jaspeado: "#C3B091", champagne: "#F7E7CE",
    cobre: "#B87333", coral: "#FF7F50", aqua_blue: "#00FFFF",
    magenta: "#D946EF", cian: "#06B6D4", multicolor: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)", surtido: "linear-gradient(135deg, #A855F7, #EC4899, #FDBA74)"
  };

  // Helper to map a single string token to a color hex
  const extractSingleColor = (token: string) => {
    let key = token.toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
      .replace(/\s+/g, "_");
      
    // Try exact
    if (map[key]) return map[key];
    
    // Fallbacks (e.g., 'azul_marino_profundo' -> 'azul', 'naranja_neon' -> 'naranja_fluor')
    const words = key.split('_');
    if (words.length > 1) {
      if (map[words[0]]) return map[words[0]];
    }
    
    return "#9CA3AF"; // Grey generic fallback
  };

  // If it's a combination (e.g. "Azul Marino/naranja Neón" or "Off White| Navy")
  if (colorGroup.includes('/') || colorGroup.includes('|')) {
    const divider = colorGroup.includes('|') ? '|' : '/';
    const parts = colorGroup.split(divider).map(c => extractSingleColor(c));
    if (parts.length === 2) {
      return `linear-gradient(135deg, ${parts[0]} 50%, ${parts[1]} 50%)`;
    } else {
      const stops = parts.map((c, i) => `${c} ${(i / parts.length) * 100}%, ${c} ${((i + 1) / parts.length) * 100}%`).join(', ');
      return `linear-gradient(135deg, ${stops})`;
    }
  }

  return extractSingleColor(colorGroup);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getTechniqueDescription(id: string, midoceanName: string): string {
  // First, exact specific matches that cannot just be deduced by pure prefix,
  // or that we want very specific phrasing for.
  const exactDescriptions: Record<string, string> = {
    B: "Relieve / Termograbado — Elegante y duradero",
    UV: "Impresión UV — Full color sobre superficies rígidas",
    UVP: "Impresión UV 360° — Envolvente full color",
    ST: "Serigrafía Textil — Colores vivos en telas",
    ST1: "Transfer Digital — Full color fotográfico en textil",
    DTF: "DTF Transfer — Textura suave, colores vibrantes",
    SUB: "Sublimación — Full color en cerámica y poliéster",
    DL: "Impresión Digital Directa — Full color sin límite",
    DO: "Gota de Resina (Doming) — Efecto 3D brillante y protector",
    TC: "Transfer Cerámico — Resistente a calor y lavavajillas",
    DO1: "Gota de Resina (Doming) — Efecto 3D brillante y protector",
  };

  const cleanId = id.toUpperCase().trim();
  if (exactDescriptions[cleanId]) return exactDescriptions[cleanId];

  // Robust Prefix Regex Matching
  if (/^RS\d*$/.test(cleanId)) return `Serigrafía Circular — Perfecta para botellas y envases`;
  if (/^S\d*$/.test(cleanId)) return `Serigrafía — Tintas sólidas, ideal para grandes tiradas`;
  if (/^P\d*$/.test(cleanId)) return `Tampografía — Ideal para pequeños detalles en curvas`;
  if (/^RL\d*$/.test(cleanId)) return `Grabado Láser Circular — Precisión 360º en metal`;
  if (/^L\d*$/.test(cleanId)) return `Grabado Láser — Precisión máxima, acabado premium inborrable`;
  if (/^E\d*$/.test(cleanId)) return `Bordado — Acabado textil de alta calidad`;
  if (/^TR\d*$/.test(cleanId)) return `Transfer Reflectante — Alta visibilidad técnica`;
  if (/^TD\d*$/.test(cleanId)) return `Transfer Digital — Fotográfico y muy resistente`;
  if (/^TT\d*$/.test(cleanId)) return `Transfer Textil — Acabado profesional por calor`;
  if (/^T\d*$/.test(cleanId)) return `Sublimación / Transfer — Calidad de impresión extrema`;

  return `${midoceanName.trim()} — Técnica de personalización estándar`;
}

function getTechniquePricingType(id: string): string {
  const types: Record<string, string> = {
    S2: "NumberOfColours", B: "NumberOfPositions", L3: "NumberOfPositions",
    E: "AreaRange", UV: "ColourAreaRange", UVP: "AreaRange",
    ST: "NumberOfColours", ST1: "AreaRange", DTF: "AreaRange",
    T1: "AreaRange", P1: "NumberOfColours", SUB: "AreaRange",
    P5: "NumberOfColours", DL: "AreaRange", S5: "NumberOfColours",
    TD1: "AreaRange", TR: "NumberOfColours",
  };
  return types[id] || "NumberOfColours";
}
