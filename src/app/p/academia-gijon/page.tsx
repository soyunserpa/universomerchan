import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq, inArray, sql } from "drizzle-orm";
import InteractiveProposal from "@/components/proposal/InteractiveProposal";

export const metadata = {
  title: "Propuesta Aniversario - Academia Gijón | Universo Merchan",
  description: "Propuesta personalizada de merchandising para Academia Gijón",
};

// Helper for safe JSON parsing
const parseJson = (val: any, defaultVal: any = []) => {
  if (!val) return defaultVal;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch (e) { return defaultVal; }
  }
  return val;
};

// Helper to convert color group to hex (simplified, catalog-api has a full list but we can pass basic hexes)
const colorMap: Record<string, string> = {
  "blanco": "#FFFFFF", "negro": "#000000", "rojo": "#FF0000", "azul": "#0000FF",
  "marino": "#000080", "verde": "#008000", "amarillo": "#FFFF00", "naranja": "#FFA500",
  "gris": "#808080", "rosa": "#FFC0CB", "morado": "#800080", "burdeos": "#800020"
};
const getHex = (desc: string) => {
  if (!desc) return "#ccc";
  const lower = desc.toLowerCase();
  for (const k in colorMap) {
    if (lower.includes(k)) return colorMap[k];
  }
  return "#ccc";
};

export default async function AcademiaGijonPage() {
  const codes = ["S11380", "S11970", "S11500", "S11770", "S03565", "S03578"];
  
  // 1. Base Products
  const products = await db.query.products.findMany({ where: inArray(schema.products.masterCode, codes) });
  const productIds = products.map(p => p.id);

  // 2. Base Prices & Manipulations
  const basePrices = await db.query.productPrices.findMany({ where: inArray(schema.productPrices.masterCode, codes) });
  const manipulations = await db.query.printManipulations.findMany({});

  // 3. Print Costs (Serigrafía ST1)
  const st1 = await db.query.printPrices.findFirst({ where: eq(schema.printPrices.techniqueId, "ST1") });

  // 4. Blank Positions
  let blankImages: any = {};
  try {
    const dbPos = await db.execute(
      sql`SELECT master_code, position_id, position_description, position_image_blank FROM print_positions WHERE master_code = ANY(ARRAY[${sql.join(codes.map(c => sql`${c}`), sql`, `)}]) AND position_image_blank IS NOT NULL`
    );
    const rows = (dbPos as any).rows || dbPos || [];
    for (const r of rows) {
      if (!blankImages[r.master_code]) blankImages[r.master_code] = { front: null, back: null };
      if (r.position_description?.toLowerCase().includes("chest") || r.position_id?.toLowerCase().includes("front")) {
        blankImages[r.master_code].front = r.position_image_blank;
      }
      if (r.position_description?.toLowerCase().includes("back") || r.position_id?.toLowerCase().includes("back")) {
        blankImages[r.master_code].back = r.position_image_blank;
      }
    }
  } catch (e) { console.error(e); }

  // 5. Variants & Variant Prices
  const variants = await db.query.productVariants.findMany({ where: inArray(schema.productVariants.productId, productIds) });
  const variantSkus = variants.map(v => v.sku);
  
  let variantPrices: any[] = [];
  if (variantSkus.length > 0) {
    // In chunk of 1000s or just run raw query
    try {
        const vPricesRaw = await db.execute(
          sql`SELECT sku, price FROM variant_prices WHERE sku = ANY(ARRAY[${sql.join(variantSkus.map(s => sql`${s}`), sql`, `)}])`
        );
        variantPrices = (vPricesRaw as any).rows || vPricesRaw || [];
    } catch(e) {}
  }

  // 6. Build final grouped structure
  const productDataMap = products.reduce((acc, p) => {
    const basePriceRow = basePrices.find(bp => bp.masterCode === p.masterCode);
    const basePriceScales = parseJson(basePriceRow?.priceScales);
    const fallbackPrice = basePriceScales.length > 0 ? parseFloat(basePriceScales[0].price) : 0;

    const manipRow = manipulations.find(m => m.masterCode === p.printManipulation);

    // Group variants by colorCode
    const vList = variants.filter(v => v.productId === p.id);
    const colorGroups: Record<string, any> = {};

    vList.forEach(v => {
      if (!colorGroups[v.colorCode!]) {
        const assets = parseJson(v.digitalAssets);
        const front = assets.find((a: any) => a.subtype === "item_picture_front") || assets[0];
        const back = assets.find((a: any) => a.subtype === "item_picture_back") || assets[1] || front;

        colorGroups[v.colorCode!] = {
          code: v.colorCode,
          colorCode: v.colorCode,
          colorDescription: v.colorDescription,
          hex: getHex(v.colorDescription || ""),
          images: [front?.url || "", back?.url || ""],
          sizes: []
        };
      }
      
      const vPriceRow = variantPrices.find(vp => vp.sku === v.sku);
      const vPrice = vPriceRow ? parseFloat(vPriceRow.price) : fallbackPrice;

      colorGroups[v.colorCode!].sizes.push({
        sku: v.sku,
        name: v.size,
        price: vPrice
      });
    });

    const mainImage = parseJson(p.digitalAssets)?.[0]?.url || "";

    acc[p.masterCode] = {
      name: p.productName,
      masterCode: p.masterCode,
      mainImage,
      blankFront: blankImages[p.masterCode]?.front || mainImage,
      blankBack: blankImages[p.masterCode]?.back || mainImage,
      variants: Object.values(colorGroups),
      manipulationScales: parseJson(manipRow?.handlingPriceScales, null)
    };
    return acc;
  }, {} as any);

  const printData = {
    technique: "Serigrafía (1 Color)",
    setup: st1 ? parseFloat(String(st1.setup).replace(',', '.')) : 32.0,
    varCosts: parseJson(st1?.varCosts, [])
  };

  return (
    <div className="min-h-screen bg-surface-50 font-body pb-20">
      <InteractiveProposal productDataMap={productDataMap} printData={printData} />
    </div>
  );
}
