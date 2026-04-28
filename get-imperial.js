const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const p = await sql`SELECT price_scales FROM product_prices WHERE master_code = 'S11500'`;
  console.log(JSON.stringify(p[0].price_scales));
  process.exit(0);
}
run();
