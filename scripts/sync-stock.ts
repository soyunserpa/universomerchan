const API_KEY = process.env.MIDOCEAN_API_KEY;
const DB_URL = process.env.DATABASE_URL;
if (!API_KEY || !DB_URL) { console.error("Missing env vars"); process.exit(1); }
import postgres from "postgres";
const sql = postgres(DB_URL);

async function main() {
  console.log("[Stock] Step 1: Getting pre-signed URL from Midocean...");
  const res1 = await fetch("https://api.midocean.com/gateway/stock/2.0", {
    headers: { "x-Gateway-APIKey": API_KEY! },
    redirect: "manual"
  });
  
  let stockUrl: string;
  if (res1.status === 303 || res1.status === 302) {
    const location = res1.headers.get("location");
    if (location) {
      stockUrl = location;
    } else {
      const body = await res1.json();
      stockUrl = body.preSignedUrl;
    }
  } else {
    const body = await res1.json();
    stockUrl = body.preSignedUrl;
  }
  
  if (!stockUrl) { console.error("[Stock] No pre-signed URL found"); process.exit(1); }
  console.log("[Stock] Step 2: Downloading stock data from S3...");
  
  const res2 = await fetch(stockUrl);
  if (!res2.ok) { console.error("[Stock] S3 error", res2.status); process.exit(1); }
  const data = await res2.json();
  
  const stockItems = data.stock || data;
  console.log("[Stock] Received " + (Array.isArray(stockItems) ? stockItems.length : "unknown") + " stock entries");
  
  if (!Array.isArray(stockItems)) {
    console.log("[Stock] Data keys:", Object.keys(data).join(", "));
    console.log("[Stock] First 200 chars:", JSON.stringify(data).substring(0, 200));
    process.exit(1);
  }

  // Add stock column to variants if not exists
  try { await sql`ALTER TABLE product_variants ADD COLUMN stock INTEGER DEFAULT 0`; } catch(e) {}
  
  // Update stock
  let updated = 0;
  for (const item of stockItems) {
    const sku = item.sku;
    const qty = parseInt(item.qty || item.quantity || item.stock || "0");
    if (!sku) continue;
    try {
      const r = await sql`UPDATE product_variants SET stock = ${qty} WHERE sku = ${sku}`;
      if (r.count > 0) updated++;
    } catch(e) {}
    if (updated % 1000 === 0 && updated > 0) console.log("  " + updated + " updated...");
  }
  
  console.log("[Stock] " + updated + " variant stock levels updated");
  
  // Also update the stock table if it exists
  try {
    await sql`DELETE FROM stock`;
    let stockInserted = 0;
    for (const item of stockItems) {
      const sku = item.sku;
      const qty = parseInt(item.qty || item.quantity || item.stock || "0");
      if (!sku) continue;
      try {
        await sql`INSERT INTO stock (sku, quantity, last_synced_at) VALUES (${sku}, ${qty}, NOW())`;
        stockInserted++;
      } catch(e) {}
    }
    console.log("[Stock] " + stockInserted + " stock table entries created");
  } catch(e) {
    console.log("[Stock] Stock table insert skipped:", (e as any).message?.substring(0, 80));
  }
  
  console.log("\nDone!");
  await sql.end();
}
main().catch(e => { console.error(e.message); process.exit(1); });
