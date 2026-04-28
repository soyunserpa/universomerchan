const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const o = await sql`SELECT id, order_number, status, total_price, subtotal_product, created_at, midocean_order_id FROM orders ORDER BY created_at DESC LIMIT 1`;
  console.log(o);
  process.exit(0);
}
run();
