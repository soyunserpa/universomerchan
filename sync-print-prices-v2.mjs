cat > /var/www/universomerchan/sync-print-prices-v2.mjs << 'ENDOFSCRIPT'
import postgres from 'postgres';
import { readFileSync } from 'fs';

const envFile = readFileSync('/var/www/universomerchan/.env', 'utf8');
function getEnv(key) {
  const match = envFile.match(new RegExp(`${key}=["']?([^"'\\n]+)["']?`));
  return match ? match[1].trim() : null;
}

const DATABASE_URL = getEnv('DATABASE_URL');
const API_KEY = getEnv('MIDOCEAN_API_KEY');
console.log('DB:', DATABASE_URL ? 'found' : 'MISSING');
console.log('API Key:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'MISSING');

const sql = postgres(DATABASE_URL);

const res = await fetch('https://api.midocean.com/gateway/printpricelist/2.0', {
  headers: { 'x-Gateway-APIKey': API_KEY }
});
if (!res.ok) { console.error('API error:', res.status); await sql.end(); process.exit(1); }

const data = await res.json();
console.log(`Received: ${data.print_techniques?.length || 0} techniques, ${data.print_manipulations?.length || 0} manipulations`);

function parseNum(val) {
  if (!val || typeof val !== 'string' || !val.trim()) return null;
  return parseFloat(val.replace(/\./g, '').replace(',', '.'));
}

let techCount = 0;
for (const t of data.print_techniques || []) {
  const setupVal = parseNum(t.setup);
  const setupRepeatVal = parseNum(t.setup_repeat);
  const nextColour = t.next_colour_cost_indicator === 'true' || t.next_colour_cost_indicator === 'X';
  const varCostsJson = JSON.stringify(t.var_costs || []);
  const validFrom = data.pricelist_valid_from || '';
  const validUntil = data.pricelist_valid_until || '';

  try {
    await sql`
      INSERT INTO print_prices (
        technique_id, technique_description, pricing_type,
        setup, setup_repeat, next_colour_cost_indicator,
        var_costs, currency, pricelist_valid_from, pricelist_valid_until, last_synced_at
      ) VALUES (
        ${t.id}, ${t.description || t.id}, ${t.pricing_type},
        ${setupVal}, ${setupRepeatVal}, ${nextColour},
        ${varCostsJson}::jsonb, ${data.currency || 'EUR'},
        ${validFrom}, ${validUntil}, NOW()
      )
      ON CONFLICT (technique_id) DO UPDATE SET
        technique_description = EXCLUDED.technique_description,
        pricing_type = EXCLUDED.pricing_type,
        setup = EXCLUDED.setup,
        setup_repeat = EXCLUDED.setup_repeat,
        next_colour_cost_indicator = EXCLUDED.next_colour_cost_indicator,
        var_costs = EXCLUDED.var_costs,
        currency = EXCLUDED.currency,
        last_synced_at = NOW()
    `;
    techCount++;
  } catch (err) {
    console.error(`  Error technique ${t.id}:`, err.message);
  }
}
console.log(`Inserted/updated ${techCount} techniques`);

let manipCount = 0;
for (const m of data.print_manipulations || []) {
  const masterCode = m.master_code || m.masterCode || m.id || 'UNKNOWN';
  const scalesJson = JSON.stringify(m.handling_price_scales || m.price_scales || m.scales || m);
  try {
    await sql`
      INSERT INTO print_manipulations (master_code, handling_price_scales, last_synced_at)
      VALUES (${masterCode}, ${scalesJson}::jsonb, NOW())
      ON CONFLICT (master_code) DO UPDATE SET
        handling_price_scales = EXCLUDED.handling_price_scales, last_synced_at = NOW()
    `;
    manipCount++;
  } catch (err) {
    console.error(`  Error manipulation ${masterCode}:`, err.message);
  }
}
console.log(`Inserted/updated ${manipCount} manipulations`);

const tc = await sql`SELECT COUNT(*) as c FROM print_prices`;
const mc = await sql`SELECT COUNT(*) as c FROM print_manipulations`;
console.log(`\nFinal: print_prices=${tc[0].c}, print_manipulations=${mc[0].c}`);

const samples = await sql`SELECT technique_id, technique_description, pricing_type, setup, substring(var_costs::text,1,200) as vc FROM print_prices LIMIT 5`;
for (const s of samples) console.log(`  ${s.technique_id} (${s.technique_description}) ${s.pricing_type} setup=${s.setup} costs=${s.vc}`);

await sql.end();
process.exit(0);
