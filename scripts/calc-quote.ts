import { db } from "../src/lib/database";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/schema";

async function run() {
  const queries = ["Regent", "Imperial", "9949", "9948", "46600", "MO7602"];
  
  for (const q of queries) {
    console.log(`\n--- Searching for: ${q} ---`);
    const results = await db.query.products.findMany({
      where: sql`title ILIKE ${'%' + q + '%'} OR midocean_sku ILIKE ${'%' + q + '%'}`,
      limit: 1,
      with: {
        images: { limit: 1 },
      }
    });
    
    if (results.length > 0) {
      const p = results[0];
      console.log(`Found: ${p.masterCode} - ${p.title}`);
      console.log(`Image: ${p.images[0]?.url}`);
    } else {
      console.log(`Not found.`);
    }
  }
}
run();
