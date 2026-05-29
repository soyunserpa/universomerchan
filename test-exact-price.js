const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
import 'dotenv/config';
import { db } from './src/lib/database.js';
import * as schema from './src/lib/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  const masterCode = 'S11500';
  
  // 1. Variant Prices
  const vpRes = await db.execute("SELECT sku, price, price_scales::text as scales_json FROM variant_prices WHERE master_code = 'S11500' LIMIT 1");
  console.log("Variant pricing for S11500:", vpRes.rows[0]);
  
  // 2. Print positions and techniques
  const posRes = await db.execute("SELECT position_id, max_print_width, max_print_height, available_techniques::text as tech_json FROM products WHERE master_code = 'S11500'");
  
  // 3. Print prices for TD, ST
  const printRes = await db.execute("SELECT technique_id, setup, var_costs::text as var_costs FROM print_prices WHERE technique_id IN ('TD', 'TD1', 'ST', 'ST1', 'TR')");
  console.log("Print costs:", printRes.rows.map(r => ({ ...r, var_costs: JSON.parse(r.var_costs).map(vc => ({ range_id: vc.range_id, scales: vc.scales.length }))})));
  
  process.exit(0);
}
run();
`;
    conn.exec(`cd /var/www/universomerchan && cat << 'INNER_EOF' > /tmp/test-exact-price.ts\n${script}\nINNER_EOF\n npx tsx /tmp/test-exact-price.ts`, (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          console.log(data);
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
