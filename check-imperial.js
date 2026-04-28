const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const p = await sql`SELECT product_name, custom_price, is_visible FROM products WHERE master_code = 'S11500'`;
  console.log(p);
  process.exit(0);
}
run();
