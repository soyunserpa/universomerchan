const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const clients = await sql`SELECT id, first_name, last_name, discount_percent FROM clients WHERE discount_percent > 0`;
  console.log(clients);
  process.exit(0);
}
run();
