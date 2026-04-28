import { getStartingPrice } from "./src/lib/price-calculator";
console.log(getStartingPrice([ { price: 2.01, minimum_quantity: 1 } as any ], 40));
