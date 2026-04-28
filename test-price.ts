import { calculateFullPrice, getStartingPrice } from './src/lib/price-calculator';

const productScales = [ { minimumQuantity: 1, costPrice: 2.01 } ];

const p1 = calculateFullPrice({
  quantity: 150,
  productPriceScales: productScales,
  printCosts: { setupCost: 42 * 2, printingCost: 0.50 * 150 * 2, handlingCost: 0.15 * 150 * 2, totalCost: 84 + 150 + 45 },
  margins: { productMarginPct: 40, printMarginPct: 50, clientDiscountPct: 0 }
});

console.log(p1);
