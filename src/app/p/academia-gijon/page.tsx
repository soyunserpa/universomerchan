import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";
import InteractiveProposal from "@/components/proposal/InteractiveProposal";

export const metadata = {
  title: "Propuesta Aniversario - Academia Gijón | Universo Merchan",
  description: "Propuesta personalizada de merchandising para Academia Gijón",
};

export default async function AcademiaGijonPage() {
  const codes = ["S11380", "S11970", "S11500", "S11770", "S03565", "S03578"];
  
  // 1. Fetch Products
  const products = await db.query.products.findMany({
    where: inArray(schema.products.masterCode, codes),
  });

  // 2. Fetch Product Prices
  const productPrices = await db.query.productPrices.findMany({
    where: inArray(schema.productPrices.masterCode, codes),
  });

  // 3. Fetch Print Prices (Serigrafía ST1)
  const st1 = await db.query.printPrices.findFirst({
    where: eq(schema.printPrices.techniqueId, "ST1"),
  });

  // 4. Fetch Print Manipulations
  const manipulations = await db.query.printManipulations.findMany({});

  // 5. Structure data for the Client Component
  const productDataMap = products.reduce((acc, p) => {
    const priceRow = productPrices.find(pp => pp.masterCode === p.masterCode);
    const manipRow = manipulations.find(m => m.masterCode === p.printManipulation);
    
    // Extraer imagen principal
    let mainImage = "";
    if (p.digitalAssets && Array.isArray(p.digitalAssets) && p.digitalAssets.length > 0) {
      mainImage = p.digitalAssets[0].url || "";
    }

    acc[p.masterCode] = {
      name: p.productName,
      masterCode: p.masterCode,
      mainImage,
      priceScales: priceRow ? (typeof priceRow.priceScales === "string" ? JSON.parse(priceRow.priceScales) : priceRow.priceScales) : [],
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
    <div className="min-h-screen bg-surface-50 font-body">
      <InteractiveProposal productDataMap={productDataMap} printData={printData} />
    </div>
  );
}
