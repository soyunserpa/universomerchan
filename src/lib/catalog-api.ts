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
import { eq, and, like, sql, desc, asc, ilike, or } from "drizzle-orm";
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
  }>;
  numberOfPrintPositions: number;
  mainImage: string;
}

export async function getProductList(params: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "name" | "price_asc" | "price_desc" | "newest" | "stock";
  greenOnly?: boolean;
}): Promise<{ products: CatalogProductResponse[]; total: number; pages: number }> {
  const { category, search, page = 1, limit = 24, sort = "name", greenOnly } = params;
  
  // Build where conditions
  const conditions = [eq(schema.products.isVisible, true)];
  
  if (category && category !== "Todos") {
    conditions.push(eq(schema.products.categoryLevel1, category));
  }
  
  if (search) {
    conditions.push(
      or(
        ilike(schema.products.productName, `%${search}%`),
        ilike(schema.products.shortDescription, `%${search}%`),
        ilike(schema.products.categoryLevel1, `%${search}%`),
        ilike(schema.products.categoryLevel2, `%${search}%`),
        ilike(schema.products.masterCode, `%${search}%`),
        ilike(schema.products.material, `%${search}%`),
      )!
    );
  }
  
  if (greenOnly) {
    conditions.push(eq(schema.products.isGreen, true));
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
      
      variantsWithStock.push({
        sku: variant.sku,
        color: variant.colorDescription || "",
        colorGroup: variant.colorGroup || "",
        colorCode: variant.colorCode || "",
        colorHex: variant.colorHex || colorGroupToHex(variant.colorGroup || ""),
        size: variant.size || undefined,
        stock: qty,
        mainImage: frontImage?.url || "",
        mainImageHiRes: frontImage?.url_highress || frontImage?.url || "",
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
      description: getTechniqueDescription(t.technique_id || t.id),
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

  return {
    ...base,
    longDescription: product.longDescription || "",
    brand: product.brand || "",
    countryOfOrigin: product.countryOfOrigin || "",
    documents,
    priceScales,
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
  const map: Record<string, string> = {
    black: "#222222",
    white: "#F8F8F8",
    blue: "#1E40AF",
    red: "#DC2626",
    green: "#15803D",
    yellow: "#EAB308",
    orange: "#EA580C",
    pink: "#EC4899",
    purple: "#7C3AED",
    grey: "#6B7280",
    gray: "#6B7280",
    brown: "#78350F",
    navy: "#1E3A5F",
    silver: "#C0C0C0",
    gold: "#D4A017",
    natural: "#F5F0E6",
    beige: "#F5F5DC",
    transparent: "#E8E8E8",
  };
  return map[colorGroup.toLowerCase()] || "#9CA3AF";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getTechniqueDescription(id: string): string {
  const descriptions: Record<string, string> = {
    S2: "Serigrafía — Tintas sólidas, ideal para logos de pocos colores",
    B: "Grabado en relieve — Elegante y duradero",
    L3: "Grabado láser — Precisión máxima, acabado premium en metal",
    E: "Bordado — Alta calidad, resistente a lavados",
    UV: "Impresión UV — Full color sobre superficies rígidas",
    UVP: "Impresión UV 360° — Envolvente full color",
    ST: "Serigrafía textil — Colores vivos en camisetas",
    ST1: "Transfer digital — Full color fotográfico en textil",
    DTF: "DTF Transfer — Textura suave, colores vibrantes",
    T1: "Sublimación textil — Colores vibrantes en poliéster",
    P1: "Tampografía — Ideal para objetos curvos y pequeños",
    SUB: "Sublimación — Full color en cerámica y poliéster",
    P5: "Tampografía digital — Mayor detalle y colores",
    DL: "Impresión digital directa — Full color sin límite",
    S5: "Serigrafía transfer — Colores sólidos en textil",
    TD1: "Transfer digital DTG — Fotográfico en algodón",
    TR: "Transfer reflectante — Visibilidad nocturna",
  };
  return descriptions[id] || id;
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
