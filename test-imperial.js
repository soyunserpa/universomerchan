import 'dotenv/config';
import pg from 'pg';
const client = new pg.Client({ connectionString: 'postgresql://universo:***REMOVED***@localhost:5432/universomerchan' });
async function run() {
  await client.connect();
  const res = await client.query("SELECT master_code, name, sku FROM products WHERE name ILIKE '%Imperial%'");
  console.log("Found:", res.rows);
  const res2 = await client.query("SELECT master_code, name, sku FROM products WHERE master_code ILIKE '%11500%'");
  console.log("Found S11500:", res2.rows);
  await client.end();
}
run();
