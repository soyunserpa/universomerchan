const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const vp = await sql`SELECT sku, price FROM variant_prices WHERE master_code = 'S11500' AND price = 2.01`;
  console.log(vp);
  process.exit(0);
}
run();
