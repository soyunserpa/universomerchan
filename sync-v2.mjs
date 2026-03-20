import postgres from 'postgres';
import { readFileSync } from 'fs';
const envFile = readFileSync('/var/www/universomerchan/.env', 'utf8');
function getEnv(key) { const m = envFile.match(new RegExp(key + '=["\x27]?([^"\x27\\n]+)["\x27]?')); return m ? m[1].trim() : null; }
const sql = postgres(getEnv('DATABASE_URL'));
const API_KEY = getEnv('MIDOCEAN_API_KEY');
console.log('Key:', API_KEY ? 'ok' : 'MISSING');
const res = await fetch('https://api.midocean.com/gateway/printpricelist/2.0', { headers: { 'x-Gateway-APIKey': API_KEY } });
if (!res.ok) { console.error('API fail:', res.status); await sql.end(); process.exit(1); }
const data = await res.json();
console.log('Techniques:', data.print_techniques?.length, 'Manipulations:', data.print_manipulations?.length);
function pn(v) { if (!v || typeof v !== 'string' || !v.trim()) return null; return parseFloat(v.replace(/\./g, '').replace(',', '.')); }
let tc = 0;
for (const t of data.print_techniques || []) {
  const su = pn(t.setup), sr = pn(t.setup_repeat);
  const nc = t.next_colour_cost_indicator === 'true' || t.next_colour_cost_indicator === 'X';
  const vc = JSON.stringify(t.var_costs || []);
  const vf = data.pricelist_valid_from || '', vu = data.pricelist_valid_until || '';
  try {
    await sql`INSERT INTO print_prices (technique_id,technique_description,pricing_type,setup,setup_repeat,next_colour_cost_indicator,var_costs,currency,pricelist_valid_from,pricelist_valid_until,last_synced_at) VALUES (${t.id},${t.description||t.id},${t.pricing_type},${su},${sr},${nc},${vc}::jsonb,${data.currency||'EUR'},${vf},${vu},NOW()) ON CONFLICT (technique_id) DO UPDATE SET technique_description=EXCLUDED.technique_description,pricing_type=EXCLUDED.pricing_type,setup=EXCLUDED.setup,setup_repeat=EXCLUDED.setup_repeat,next_colour_cost_indicator=EXCLUDED.next_colour_cost_indicator,var_costs=EXCLUDED.var_costs,currency=EXCLUDED.currency,last_synced_at=NOW()`;
    tc++;
  } catch(e) { console.error('ERR tech', t.id, e.message); }
}
console.log('Techniques inserted:', tc);
let mc = 0;
for (const m of data.print_manipulations || []) {
  const mk = m.master_code || m.id || 'UNK';
  const sj = JSON.stringify(m.handling_price_scales || m.price_scales || m.scales || m);
  try {
    await sql`INSERT INTO print_manipulations (master_code,handling_price_scales,last_synced_at) VALUES (${mk},${sj}::jsonb,NOW()) ON CONFLICT (master_code) DO UPDATE SET handling_price_scales=EXCLUDED.handling_price_scales,last_synced_at=NOW()`;
    mc++;
  } catch(e) { console.error('ERR manip', mk, e.message); }
}
console.log('Manipulations inserted:', mc);
const r1 = await sql`SELECT COUNT(*) as c FROM print_prices`;
const r2 = await sql`SELECT COUNT(*) as c FROM print_manipulations`;
console.log('Final counts:', r1[0].c, 'techniques,', r2[0].c, 'manipulations');
const ex = await sql`SELECT technique_id,pricing_type,setup FROM print_prices LIMIT 5`;
for (const e of ex) console.log(' ', e.technique_id, e.pricing_type, 'setup='+e.setup);
await sql.end();
