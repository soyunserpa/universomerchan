import postgres from "postgres";
import "dotenv/config";

const sql_conn = postgres(process.env.DATABASE_URL!);

async function run() {
  const res = await sql_conn`SELECT * FROM admin_settings WHERE key LIKE '%margin%'`;
  console.log("=== Margins ===");
  for (const r of res) {
    console.log(`${r.key}: ${r.value}`);
  }
  process.exit(0);
}
run();
