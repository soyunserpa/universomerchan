const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const v = await client.query(`SELECT sku, color_code, color_description FROM product_variants WHERE master_code = 'MO2762'`);
  const p = await client.query(`SELECT position_id, position_image_variants::text FROM print_positions WHERE master_code = 'MO2762' LIMIT 1`);
  console.log("VARIANTS:", JSON.stringify(v.rows, null, 2));
  console.log("PRINT ZONES:", JSON.stringify(p.rows, null, 2));
  await client.end();
}
run().catch(console.error);
