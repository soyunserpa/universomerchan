require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query(`SELECT id, user_id, status, stripe_session_id, created_at, midocean_order_id FROM orders WHERE created_at >= '2026-05-14' AND created_at < '2026-05-16' ORDER BY created_at DESC`);
  console.log(JSON.stringify(res.rows, null, 2));
  pool.end();
}
run();
