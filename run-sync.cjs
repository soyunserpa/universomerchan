const https = require("https");
const { Client } = require("pg");

const MIDOCEAN_API_KEY = "0f4a331a-e3d7-4730-81ba-46de635b624f";
const db = new Client({ host: "localhost", database: "universomerchan", user: "universo", password: "UmErch2026Pg" });

function fetchJSON(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(JSON.parse(data)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

function parseEU(s) { return parseFloat(s.replace(/\./g, "").replace(",", ".")); }

(async () => {
  await db.connect();
  console.log("[Sync] Fetching pricelist...");
  const data = await fetchJSON("https://api.midocean.com/gateway/pricelist/2.0", { "x-Gateway-APIKey": MIDOCEAN_API_KEY });
  const skuPrices = data.price || [];
  console.log("[Sync] Received", skuPrices.length, "SKU prices");

  const res = await db.query("SELECT master_code FROM products");
  const codes = new Set(res.rows.map(r => r.master_code));

  const byMaster = new Map();
  for (const entry of skuPrices) {
    const sku = entry.sku || "";
    const price = parseEU(entry.price || "0");
    if (isNaN(price) || price <= 0) continue;
    let mc = "";
    const parts = sku.split("-");
    for (let i = parts.length; i >= 1; i--) { const c = parts.slice(0, i).join("-"); if (codes.has(c)) { mc = c; break; } }
    if (!mc) mc = parts[0] || "";
    if (!mc) continue;
    if (!byMaster.has(mc)) byMaster.set(mc, []);
    byMaster.get(mc).push({ price, validUntil: entry.valid_until || "", scales: entry.scale || [] });
  }
  console.log("[Sync] Grouped into", byMaster.size, "master codes");

  let updated = 0, withScales = 0;
  for (const [masterCode, entries] of byMaster) {
    const best = entries.filter(e => e.scales.length > 0).sort((a, b) => b.scales.length - a.scales.length)[0];
    let ps;
    if (best) {
      ps = best.scales.map(s => ({ minimum_quantity: s.minimum_quantity, price: s.price })).sort((a, b) => parseInt(a.minimum_quantity) - parseInt(b.minimum_quantity));
      withScales++;
    } else {
      const min = Math.min(...entries.map(e => e.price));
      ps = [{ minimum_quantity: "1", price: min.toString() }];
    }
    const json = JSON.stringify(ps);
    await db.query(
      `INSERT INTO product_prices (master_code, currency, pricelist_valid_from, pricelist_valid_until, price_scales, last_synced_at)
       VALUES ($1, 'EUR', $2, $3, $4::jsonb, NOW())
       ON CONFLICT (master_code) DO UPDATE SET price_scales = $4::jsonb, currency = 'EUR', pricelist_valid_from = $2, pricelist_valid_until = $3, last_synced_at = NOW()`,
      [masterCode, data.date || "", entries[0]?.validUntil || "", json]
    );
    updated++;
  }
  console.log("[Sync] Done:", updated, "products (" + withScales + " with quantity scales)");

  const v1 = await db.query("SELECT price_scales::text FROM product_prices WHERE master_code = 'S47101'");
  console.log("S47101:", v1.rows[0]?.price_scales?.substring(0, 200));
  const v2 = await db.query("SELECT price_scales::text FROM product_prices WHERE master_code = 'MO1001'");
  console.log("MO1001:", v2.rows[0]?.price_scales?.substring(0, 200));

  await db.end();
})();
