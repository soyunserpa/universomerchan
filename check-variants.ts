import { db } from "./src/lib/db.ts";
import { sql } from "drizzle-orm";
async function run() {
  const v = await db.execute(sql`SELECT sku, color_code, color_description FROM product_variants WHERE master_code = 'MO2762'`);
  const p = await db.execute(sql`SELECT position_id, position_image_variants::text FROM print_positions WHERE master_code = 'MO2762' LIMIT 1`);
  console.log("VARIANTS:", JSON.stringify((v as any).rows || v, null, 2));
  console.log("PRINT ZONES:", JSON.stringify((p as any).rows || p, null, 2));
  process.exit(0);
}
run().catch(console.error);
