import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import InteractiveProposal from "@/components/proposal/InteractiveProposal";
import { getProductList } from "@/lib/catalog-api";

export const metadata = {
  title: "Propuesta Aniversario - Academia Gijón | Universo Merchan",
  description: "Propuesta personalizada de merchandising para Academia Gijón",
};

export default async function AcademiaGijonPage() {
  const codes = ["S11380", "S11970", "S11500", "S11770", "S03565", "S03578"];
  
  // 1. Fetch fully hydrated products (includes variants, colors, pre-calculated base prices)
  const result = await getProductList({ masterCodes: codes, limit: 6 });
  const products = result.products;

  // 2. Fetch Blank Print Positions for Front & Back
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

  // 3. Fetch Print Prices (Serigrafía ST1) for dynamic cost addition
  const st1 = await db.query.printPrices.findFirst({
    where: eq(schema.printPrices.techniqueId, "ST1"),
  });

  // 4. Fetch Print Manipulations to calculate handling exactly
  const manipulations = await db.query.printManipulations.findMany({});

  // 5. Structure data for the Client Component
  const productDataMap = products.reduce((acc, p) => {
    // Find manipulation rules if needed (getProductList might already do it, but we can do it here for transparency)
    // Wait, getProductList already calculates the startingPrice, but we need the exact price per unit for the calculator.
    
    // Get raw DB product to extract printManipulation
    const manipRow = manipulations.find(m => m.masterCode === (p as any).printManipulation);
    
    acc[p.masterCode] = {
      name: p.name,
      masterCode: p.masterCode,
      mainImage: p.mainImage,
      blankFront: blankImages[p.masterCode]?.front || p.mainImage,
      blankBack: blankImages[p.masterCode]?.back || p.mainImage,
      variants: p.variants, // Contains color hexes and their specific prices!
      manipulationScales: manipRow ? (typeof manipRow.handlingPriceScales === "string" ? JSON.parse(manipRow.handlingPriceScales) : manipRow.handlingPriceScales) : null,
    };
    return acc;
  }, {} as any);

  const printData = {
    technique: "Serigrafía (1 Color)",
    setup: st1 ? parseFloat(String(st1.setup).replace(',', '.')) : 32.0,
    varCosts: st1 ? (typeof st1.varCosts === "string" ? JSON.parse(st1.varCosts) : st1.varCosts) : [],
  };

  return (
    <div className="min-h-screen bg-surface-50 font-body pb-20">
      <InteractiveProposal productDataMap={productDataMap} printData={printData} />
    </div>
  );
}
