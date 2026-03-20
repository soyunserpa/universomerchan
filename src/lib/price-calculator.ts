// ============================================================
// UNIVERSO MERCHAN — Price Calculation Service
// ============================================================
// Applies dual margins (product + print) and per-client discounts
// to Midocean cost prices to generate sell prices for the frontend.
//
// Formula:
//   PVP Producto = Coste Midocean × (1 + marginProduct/100)
//   PVP Marcaje  = (Setup + Impresión + Handling) × (1 + marginPrint/100)
//   Descuento    = (PVP total) × (1 - clientDiscount/100)
// ============================================================

export interface MarginConfig {
  productMarginPct: number;  // Default: 40
  printMarginPct: number;    // Default: 50
  clientDiscountPct: number; // Default: 0 (per-client override)
}

export interface ProductPriceScale {
  minimumQuantity: number;
  costPrice: number;  // Midocean cost
}

export interface PrintCostBreakdown {
  setupCost: number;
  printingCost: number;
  handlingCost: number;
  totalCost: number;
}

export interface PriceCalculationResult {
  // Product costs & prices
  productCostPerUnit: number;     // What Midocean charges us
  productSellPerUnit: number;     // What we charge the client
  productCostTotal: number;
  productSellTotal: number;
  
  // Print costs & prices (0 if no customization)
  printCostTotal: number;         // What Midocean charges us
  printSellTotal: number;         // What we charge the client
  printBreakdown: {
    setupCost: number;
    setupSell: number;
    printingCost: number;
    printingSell: number;
    handlingCost: number;
    handlingSell: number;
  };
  
  // Totals before discount
  subtotalSell: number;
  
  // Discount
  discountPct: number;
  discountAmount: number;
  
  // Final
  totalPrice: number;
  pricePerUnit: number;
  
  // Margins applied (for admin visibility)
  marginProductApplied: number;
  marginPrintApplied: number;
  
  // Profit
  totalCost: number;
  totalProfit: number;
  profitMarginPct: number;
}

// ============================================================
// Get the right price from scaled pricing
// Midocean uses "step" pricing: if qty is 60 and scales are
// [1, 50, 100], use the price for scale 50
// ============================================================

export function getScaledPrice(
  scales: ProductPriceScale[],
  quantity: number
): number {
  // Sort by minimum quantity ascending
  const sorted = [...scales].sort((a, b) => a.minimumQuantity - b.minimumQuantity);
  
  let selectedPrice = sorted[0]?.costPrice || 0;
  for (const scale of sorted) {
    if (quantity >= scale.minimumQuantity) {
      selectedPrice = scale.costPrice;
    }
  }
  return selectedPrice;
}

// ============================================================
// MAIN CALCULATION
// ============================================================

export function calculateFullPrice(params: {
  quantity: number;
  productPriceScales: ProductPriceScale[];
  printCosts: PrintCostBreakdown | null;  // null = no customization
  margins: MarginConfig;
}): PriceCalculationResult {
  const { quantity, productPriceScales, printCosts, margins } = params;
  
  // ── PRODUCT PRICE ──────────────────────────────────────────
  const productCostPerUnit = getScaledPrice(productPriceScales, quantity);
  const productCostTotal = productCostPerUnit * quantity;
  const productSellPerUnit = productCostPerUnit * (1 + margins.productMarginPct / 100);
  const productSellTotal = productSellPerUnit * quantity;
  
  // ── PRINT PRICE ────────────────────────────────────────────
  let printCostTotal = 0;
  let printSellTotal = 0;
  let printBreakdown = {
    setupCost: 0, setupSell: 0,
    printingCost: 0, printingSell: 0,
    handlingCost: 0, handlingSell: 0,
  };
  
  if (printCosts) {
    const printMultiplier = 1 + margins.printMarginPct / 100;
    
    printBreakdown = {
      setupCost: printCosts.setupCost,
      setupSell: round(printCosts.setupCost * printMultiplier),
      printingCost: printCosts.printingCost,
      printingSell: round(printCosts.printingCost * printMultiplier),
      handlingCost: printCosts.handlingCost,
      handlingSell: round(printCosts.handlingCost * printMultiplier),
    };
    
    printCostTotal = printCosts.totalCost;
    printSellTotal = round(printCosts.totalCost * printMultiplier);
  }
  
  // ── SUBTOTAL ───────────────────────────────────────────────
  const subtotalSell = round(productSellTotal + printSellTotal);
  
  // ── DISCOUNT ───────────────────────────────────────────────
  const discountPct = margins.clientDiscountPct;
  const discountAmount = round(subtotalSell * (discountPct / 100));
  
  // ── FINAL ──────────────────────────────────────────────────
  const totalPrice = round(subtotalSell - discountAmount);
  const pricePerUnit = round(totalPrice / quantity);
  const totalCost = round(productCostTotal + printCostTotal);
  const totalProfit = round(totalPrice - totalCost);
  const profitMarginPct = totalCost > 0 ? round((totalProfit / totalCost) * 100) : 0;
  
  return {
    productCostPerUnit: round(productCostPerUnit),
    productSellPerUnit: round(productSellPerUnit),
    productCostTotal: round(productCostTotal),
    productSellTotal: round(productSellTotal),
    printCostTotal: round(printCostTotal),
    printSellTotal: round(printSellTotal),
    printBreakdown,
    subtotalSell,
    discountPct,
    discountAmount,
    totalPrice,
    pricePerUnit,
    marginProductApplied: margins.productMarginPct,
    marginPrintApplied: margins.printMarginPct,
    totalCost,
    totalProfit,
    profitMarginPct,
  };
}

// ============================================================
// QUICK PRICE — For catalog listing (product only, no print)
// Shows "Desde X€" based on the lowest scaled price + margin
// ============================================================

export function getStartingPrice(
  priceScales: ProductPriceScale[],
  productMarginPct: number = 40
): number {
  if (!priceScales.length) return 0;
  // Get the cheapest per-unit price (highest quantity scale)
  const sorted = [...priceScales].sort((a, b) => b.minimumQuantity - a.minimumQuantity);
  const cheapest = sorted[0].costPrice;
  return round(cheapest * (1 + productMarginPct / 100));
}

// ============================================================
// FORMAT — Currency display
// ============================================================

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatPriceShort(price: number): string {
  return `${price.toFixed(2)}€`;
}

// ============================================================
// HELPER
// ============================================================

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
