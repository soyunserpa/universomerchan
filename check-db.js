const postgres = require('postgres');
require('dotenv').config({ path: '.env' });
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const products = await sql`SELECT id, master_code FROM products WHERE master_code LIKE '%MO1001%'`;
  console.log('Products:', products);
  if (products.length > 0) {
    const variants = await sql`SELECT sku, digital_assets FROM product_variants WHERE product_id = ${products[0].id}`;
    if(variants.length > 0) {
        console.log('Assets for first:', JSON.stringify(JSON.parse(variants[0].digital_assets), null, 2).slice(0, 500));
    }
  }
  process.exit(0);
}
run();
