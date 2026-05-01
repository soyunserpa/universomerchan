const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const p = await sql`SELECT custom_price FROM products WHERE master_code = 'S11500'`;
  console.log(p[0]);
  process.exit(0);
}
run();
