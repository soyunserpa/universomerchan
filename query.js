const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function main() {
  const rows = await sql`SELECT master_code, product_name FROM products WHERE product_name ILIKE '%Regent%' OR product_name ILIKE '%Imperial%' OR product_name ILIKE '%Pioneer%'`;
  console.log(rows);
  process.exit(0);
}
main();
