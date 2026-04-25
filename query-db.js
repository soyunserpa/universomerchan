const postgres = require('postgres');
require('dotenv').config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  const email = 'contact@petitateliergraphique.fr';
  const leads = await sql`SELECT id, email, "company_name", status, created_at FROM leads WHERE email = ${email}`;
  const users = await sql`SELECT id, email, "first_name", "company_name", role FROM users WHERE email = ${email}`;
  const orders = await sql`SELECT id, "order_status", "total_price" FROM orders WHERE "user_id" IN (SELECT id FROM users WHERE email = ${email})`;
  
  console.log("--- LEADS ---");
  console.dir(leads);
  console.log("--- USERS ---");
  console.dir(users);
  console.log("--- ORDERS ---");
  console.dir(orders);
  process.exit(0);
}
run();
