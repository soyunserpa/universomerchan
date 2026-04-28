import postgres from "postgres";
import "dotenv/config";
import { getStartingPrice } from "./src/lib/price-calculator";

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  const p = await sql`SELECT price_scales FROM product_prices WHERE master_code = 'S11500'`;
  const scales = p[0].price_scales;
  console.log("Scales:", scales);
  
  const startingPrice = getStartingPrice(scales, 40);
  console.log("Starting price:", startingPrice);
  
  process.exit(0);
}
run();
