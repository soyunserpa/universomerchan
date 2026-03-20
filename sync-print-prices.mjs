import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://universo:UmErch2026Pg@localhost:5432/universomerchan';
const sql = postgres(DATABASE_URL);
const API_KEY = process.env.MIDOCEAN_API_KEY;

if (!API_KEY) {
  // Try to read from .env
  const fs = await import('fs');
  const envFile = fs.readFileSync('/var/www/universomerchan/.env', 'utf8');
  const match = envFile.match(/MIDOCEAN_API_KEY=(.+)/);
  if (match) process.env.MIDOCEAN_API_KEY = match[1].trim().replace(/["']/g, '');
}

const apiKey = process.env.MIDOCEAN_API_KEY;
console.log('API Key found:', apiKey ? 'yes (' + apiKey.substring(0,8) + '...)' : 'NO');

// Fetch print pricelist from Midocean
const res = await fetch('https://api.midocean.com/gateway/printpricelist/2.0', {
  headers: { 'x-Gateway-APIKey': apiKey }
});

if (!res.ok) {
  console.error('API error:', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
console.log('Received pricelist. Currency:', data.currency);
console.log('Techniques:', data.print_techniques?.length || 0);
console.log('Manipulations:', data.print_manipulations?.length || 0);

// Show first technique structure
if (data.print_techniques?.[0]) {
  console.log('\nSample technique:', JSON.stringify(data.print_techniques[0], null, 2).substring(0, 1000));
}

// Insert techniques
let techCount = 0;
for (const t of data.print_techniques || []) {
  await sql`
    INSERT INTO print_prices (technique_id, technique_description, pricing_type, setup, setup_repeat, next_colour_cost_indicator, var_costs, currency, pricelist_valid_from, pricelist_valid_until, last_synced_at)
    VALUES (${t.id}, ${t.description}, ${t.pricing_type}, ${t.setup ? t.setup.replace(',','.') : null}, ${t.setup_repeat && t.setup_repeat.trim() ? t.setup_repeat.replace(',','.') : null}, ${t.next_colour_cost_indicator === 'true' || t.next_colour_cost_indicator === 'X'}, ${JSON.stringify(t.var_costs)}, ${data.currency}, ${data.pricelist_valid_from}, ${data.pricelist_valid_until}, NOW())
    ON CONFLICT (technique_id) DO UPDATE SET
      technique_description = EXCLUDED.technique_description,
      pricing_type = EXCLUDED.pricing_type,
      setup = EXCLUDED.setup,
      setup_repeat = EXCLUDED.setup_repeat,
      var_costs = EXCLUDED.var_costs,
      last_synced_at = NOW()
  `;
  techCount++;
}
console.log(`\nInserted/updated ${techCount} techniques`);

// Insert manipulations
let manipCount = 0;
for (const m of data.print_manipulations || []) {
  await sql`
    INSERT INTO print_manipulations (master_code, handling_price_scales, last_synced_at)
    VALUES (${m.master_code}, ${JSON.stringify(m.handling_price_scales || m.price_scales || m)}, NOW())
    ON CONFLICT (master_code) DO UPDATE SET
      handling_price_scales = EXCLUDED.handling_price_scales,
      last_synced_at = NOW()
  `;
  manipCount++;
}
console.log(`Inserted/updated ${manipCount} manipulations`);

// Verify
const techResult = await sql`SELECT COUNT(*) as c FROM print_prices`;
const manipResult = await sql`SELECT COUNT(*) as c FROM print_manipulations`;
console.log(`\nFinal counts: print_prices=${techResult[0].c}, print_manipulations=${manipResult[0].c}`);

await sql.end();
process.exit(0);
