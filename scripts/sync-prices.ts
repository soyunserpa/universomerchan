const API_KEY = process.env.MIDOCEAN_API_KEY;
const DB_URL = process.env.DATABASE_URL;
if (!API_KEY || !DB_URL) { console.error("Missing env vars"); process.exit(1); }
import postgres from "postgres";
const sql = postgres(DB_URL);

async function main() {
  console.log("[Prices] Fetching pricelist from Midocean...");
  const res = await fetch("https://api.midocean.com/gateway/pricelist/2.0?currency=EUR", {
    headers: { "x-Gateway-APIKey": API_KEY }
  });
  if (!res.ok) { console.error("API error", res.status); process.exit(1); }
  const data = await res.json();
  const skuPrices = data.price || [];
  console.log(`[Prices] Received ${skuPrices.length} SKU prices`);

  // Add price column if missing
  try { await sql`ALTER TABLE product_variants ADD COLUMN price DECIMAL(10,2)`; } catch(e) {}

  // Update variant prices
  let updated = 0;
  for (const item of skuPrices) {
    if (!item.sku || !item.price) continue;
    const price = parseFloat(item.price.replace(",", "."));
    try {
      const r = await sql`UPDATE product_variants SET price = ${price} WHERE sku = ${item.sku}`;
      if (r.count > 0) updated++;
    } catch(e) {}
    if (updated % 500 === 0 && updated > 0) console.log(`  ${updated} updated...`);
  }
  console.log(`[Prices] ${updated} variant prices updated`);

  // Build product price aggregates
  await sql`DELETE FROM product_prices`;
  const agg = await sql`
    SELECT p.master_code, MIN(pv.price) as min_price
    FROM products p JOIN product_variants pv ON pv.product_id = p.id
    WHERE pv.price IS NOT NULL AND pv.price > 0
    GROUP BY p.master_code
  `;
  let inserted = 0;
  for (const row of agg) {
    try {
      await sql`INSERT INTO product_prices (master_code, currency, price_scales, last_synced_at)
        VALUES (${row.master_code}, 'EUR', ${JSON.stringify([{minQuantity:1, price:parseFloat(row.min_price)}])}, NOW())`;
      inserted++;
    } catch(e) {}
  }
  console.log(`[Prices] ${inserted} product price records created`);

  // Add starting_price column if missing
  try { await sql`ALTER TABLE products ADD COLUMN starting_price DECIMAL(10,2)`; } catch(e) {}
  
  const up = await sql`
    UPDATE products p SET starting_price = sub.min_price
    FROM (SELECT product_id, MIN(price) as min_price FROM product_variants WHERE price > 0 GROUP BY product_id) sub
    WHERE p.id = sub.product_id
  `;
  console.log(`[Prices] Starting price set on ${up.count} products`);
  console.log("\n✅ Price sync complete!");
  await sql.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
