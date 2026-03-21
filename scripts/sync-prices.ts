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

  // 2. Extraer scales en las variant_prices
  let updated = 0;
  for (const item of skuPrices) {
    if (!item.sku || !item.price) continue;
    const price = parseFloat(item.price.replace(",", "."));

    // Convertir el bloque scale original de la API de Midocean si existe
    let cleanScales: Array<{ minimum_quantity: number; price: number }> | null = null;
    if (item.scale && Array.isArray(item.scale)) {
      cleanScales = item.scale.map((s: any) => ({
        minimum_quantity: parseInt(s.minimum_quantity) || 1,
        price: typeof s.price === 'number' ? s.price : parseFloat((s.price as string).replace(",", "."))
      })).sort((a: any, b: any) => a.minimum_quantity - b.minimum_quantity);
    }

    try {
      // 1. Actualizar el basic price (product_variants) antiguo
      await sql`UPDATE product_variants SET price = ${price} WHERE sku = ${item.sku}`;

      // 2. Actualizar las price_scales correctas en variant_prices
      const r = await sql`
        UPDATE variant_prices 
        SET price = ${price}, 
            price_scales = ${cleanScales ? JSON.stringify(cleanScales) : null}::jsonb,
            last_synced_at = NOW()
        WHERE sku = ${item.sku}
      `;
      if (r.count > 0) updated++;
    } catch (e) { }
    if (updated % 500 === 0 && updated > 0) console.log(`  ${updated} updated...`);
  }
  console.log(`[Prices] ${updated} variant prices updated`);

  // Build product price aggregates
  await sql`DELETE FROM product_prices`;
  const agg = await sql`
    SELECT p.master_code, 
           MIN(pv.price) as min_price,
           (SELECT price_scales FROM variant_prices vp WHERE vp.master_code = p.master_code AND vp.price_scales IS NOT NULL LIMIT 1) as scales
    FROM products p JOIN product_variants pv ON pv.product_id = p.id
    WHERE pv.price IS NOT NULL AND pv.price > 0
    GROUP BY p.master_code
  `;
  let inserted = 0;
  for (const row of agg) {
    try {
      const scalesToSave = row.scales
        ? row.scales
        : [{ minimum_quantity: 1, price: parseFloat(row.min_price) }];

      await sql`INSERT INTO product_prices (master_code, currency, price_scales, last_synced_at)
        VALUES (${row.master_code}, 'EUR', ${JSON.stringify(scalesToSave)}::jsonb, NOW())`;
      inserted++;
    } catch (e) { }
  }
  console.log(`[Prices] ${inserted} product price records created`);

  // Add starting_price column if missing
  try { await sql`ALTER TABLE products ADD COLUMN starting_price DECIMAL(10,2)`; } catch (e) { }

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
