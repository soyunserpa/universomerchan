import { getProductData } from "./src/lib/catalog-api";
import postgres from "postgres";
import "dotenv/config";

async function run() {
  const p = await getProductData("S11500");
  console.log(JSON.stringify(p?.margins, null, 2));
  console.log(JSON.stringify(p?.priceScales, null, 2));
  process.exit(0);
}
run();
