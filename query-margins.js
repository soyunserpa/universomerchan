const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const settings = await sql`SELECT * FROM admin_settings WHERE key = 'category_margins'`;
  console.log(settings);
  process.exit(0);
}
run();
