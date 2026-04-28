import { db } from "./src/lib/database";
import { sql } from "drizzle-orm";

async function run() {
  const queries = [
    { code: "S11388", name: "Regent", qty: 150 },
    { code: "S11500", name: "Imperial", qty: 150 },
    { code: "MO9949", name: "9949", qty: 150 },
    { code: "MO9948", name: "9948", qty: 150 },
    { code: "S46600", name: "46600", qty: 50 },
    { code: "MO7602", name: "7602", qty: 100 }
  ];
  
  for (const q of queries) {
    const res = await db.execute(sql`SELECT id, master_code, product_name, print_manipulation FROM products WHERE master_code = ${q.code} LIMIT 1`);
    if (res.length > 0) {
      const p = res[0] as any;
      console.log(`\n\n=== Found: ${p.master_code} - ${p.product_name} | Handling: ${p.print_manipulation} ===`);
      
      const imgs = await db.execute(sql`SELECT digital_assets FROM product_variants WHERE product_id = ${p.id} LIMIT 1`);
      console.log(`Image: ${(imgs[0] as any)?.digital_assets?.[0]?.url || 'No image'}`);
      
      const prices = await db.execute(sql`SELECT price_scales FROM product_prices WHERE master_code = ${p.master_code}`);
      if (prices.length > 0) {
        console.log(`Prices JSON: ${JSON.stringify((prices[0] as any).price_scales)}`);
      }
      
      const pos = await db.execute(sql`SELECT position_id, available_techniques FROM print_positions WHERE master_code = ${p.master_code}`);
      console.log(`Positions JSON: ${JSON.stringify(pos.map((r:any) => ({ id: r.position_id, tech: r.available_techniques })))}`);
      
    } else {
      console.log(`\n\n=== ${q.name} Not found. ===`);
    }
  }
  process.exit(0);
}
run();
