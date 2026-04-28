const postgres = require('postgres');
require('dotenv').config();
const sql = postgres(process.env.DATABASE_URL);
async function run() {
  const users = await sql`SELECT email, discount_percent FROM users WHERE role = 'customer' AND discount_percent > 0`;
  console.log(users);
  process.exit(0);
}
run();
