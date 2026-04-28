import { getStartingPrice, ProductPriceScale } from "./src/lib/price-calculator";
console.log(getStartingPrice([ { price: 2.01, minimumQuantity: 1 } as unknown as ProductPriceScale ], 40));
