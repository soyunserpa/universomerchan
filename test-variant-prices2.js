const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const vp = await sql`SELECT sku, price, price_scales FROM variant_prices WHERE master_code = 'S11500' AND sku LIKE '%-FR-%'`;
  console.log(vp.slice(0, 10)); // just show the first 10
  process.exit(0);
}
run();
