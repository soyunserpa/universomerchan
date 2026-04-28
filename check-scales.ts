import postgres from "postgres";
import "dotenv/config";

const sql_conn = postgres(process.env.DATABASE_URL!);

async function run() {
  const res = await sql_conn`SELECT price_scales FROM product_prices WHERE master_code = 'S11388'`;
  console.log("=== S11388 Scales ===");
  console.log(JSON.stringify(res[0].price_scales));
  process.exit(0);
}
run();
