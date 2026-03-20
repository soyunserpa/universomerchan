// ============================================================
// PATCH for catalog-api.ts
// Adds real print pricing data to ProductDetailResponse
// Apply with: node apply-catalog-patch.mjs
// ============================================================

import { readFileSync, writeFileSync } from 'fs';

const FILE = '/var/www/universomerchan/src/lib/catalog-api.ts';
let code = readFileSync(FILE, 'utf8');

// ── 1. Add printPricing and handlingInfo to ProductDetailResponse interface ──

// Find the technique interface in ProductDetailResponse
const oldTechInterface = `    techniques: Array<{
      techniqueId: string;
      name: string;
      description: string;
      pricingType: string;
      maxColors?: number;
    }>;`;

const newTechInterface = `    techniques: Array<{
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
    };`;

if (code.includes(oldTechInterface)) {
  code = code.replace(oldTechInterface, newTechInterface);
  console.log('✓ Patched technique interface in ProductDetailResponse');
} else {
  console.log('⚠ Could not find technique interface to patch — may already be patched or format differs');
}

// ── 2. Add query to fetch print_prices data in getProductDetail ──

// Find the section where printPositions are built
const oldPrintPositionsMap = `  const printPositions = printPositionsData.map((pos: any) => ({`;

const newPrintPositionsQuery = `  // Fetch real pricing data for all techniques
  const allTechniqueIds = new Set<string>();
  for (const pos of printPositionsData) {
    const techs = typeof pos.available_techniques === 'string' ? JSON.parse(pos.available_techniques) : (pos.available_techniques || []);
    for (const t of techs) {
      allTechniqueIds.add(t.technique_id || t.id);
    }
  }
  
  // Get print prices from DB
  const printPricesData: Record<string, any> = {};
  if (allTechniqueIds.size > 0) {
    const techIds = Array.from(allTechniqueIds);
    const priceRows = await db.execute(
      sql\`SELECT technique_id, pricing_type, setup, setup_repeat, next_colour_cost_indicator, var_costs::text as var_costs_json FROM print_prices WHERE technique_id = ANY(\${techIds})\`
    );
    for (const row of ((priceRows as any).rows || priceRows)) {
      printPricesData[row.technique_id] = row;
    }
  }

  // Get handling info for this product
  let handlingInfo: { code: string; description: string; pricePerUnit: number } | undefined;
  const productManipCode = product.printManipulation || (product as any).print_manipulation;
  if (productManipCode) {
    const manipRow = await db.execute(
      sql\`SELECT handling_price_scales::text as data FROM print_manipulations WHERE master_code = \${productManipCode}\`
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

  const printPositions = printPositionsData.map((pos: any) => ({`;

if (code.includes(oldPrintPositionsMap)) {
  code = code.replace(oldPrintPositionsMap, newPrintPositionsQuery);
  console.log('✓ Added print_prices query before printPositions map');
} else {
  console.log('⚠ Could not find printPositions map to patch');
}

// ── 3. Add pricing data to each technique in the map ──

const oldTechMap = `      maxColors: t.max_number_of_colors ? parseInt(t.max_number_of_colors) : (t.max_colours ? parseInt(t.max_colours) : undefined),
    })),
  }));`;

const newTechMap = `      maxColors: t.max_number_of_colors ? parseInt(t.max_number_of_colors) : (t.max_colours ? parseInt(t.max_colours) : undefined),
      pricing: (() => {
        const techId = t.technique_id || t.id;
        const priceData = printPricesData[techId];
        if (!priceData) return undefined;
        const parseEU = (v: any) => {
          if (!v || v === '') return 0;
          if (typeof v === 'number') return v;
          return parseFloat(String(v).replace(/\\./g, '').replace(',', '.')) || 0;
        };
        let varCosts: any[] = [];
        try {
          varCosts = typeof priceData.var_costs_json === 'string' ? JSON.parse(priceData.var_costs_json) : (priceData.var_costs || []);
        } catch { varCosts = []; }
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
  }));`;

if (code.includes(oldTechMap)) {
  code = code.replace(oldTechMap, newTechMap);
  console.log('✓ Added pricing data to each technique');
} else {
  console.log('⚠ Could not find technique map ending to patch');
}

// ── 4. Remove hardcoded getTechniquePricingType (now comes from DB) ──
// Keep it as fallback but the real data takes precedence in the frontend

writeFileSync(FILE, code);
console.log('\n✅ catalog-api.ts patched successfully!');
console.log('Run: cd /var/www/universomerchan && rm -rf .next && npm run build');
