import { db } from "./src/lib/database";
import { sql } from "drizzle-orm";
import * as schema from "./src/lib/schema";

async function run() {
  const queries = [
    { code: "S11388", name: "Regent" },
    { code: "S11500", name: "Imperial" },
    { code: "IT9949", name: "9949" }, // or MO9949
    { code: "IT9948", name: "9948" }, // or MO9948
    { code: "S46600", name: "46600" },
    { code: "MO7602", name: "7602" }
  ];
  
  for (const q of queries) {
    const results = await db.query.products.findMany({
      where: sql`master_code ILIKE ${'%' + q.name + '%'} OR product_name ILIKE ${'%' + q.name + '%'}`,
      limit: 1,
      with: {
        prices: true
      }
    });
    
    if (results.length > 0) {
      const p = results[0];
      console.log(`Found: ${p.masterCode} - ${p.productName}`);
      console.log(`Prices:`, p.prices.map((pr:any) => `${pr.minimumQuantity}:${pr.costPrice}`).join(", "));
    } else {
      console.log(`Not found: ${q.name}`);
    }
  }
  process.exit(0);
}
run();
