import postgres from "postgres";
import "dotenv/config";

const sql_conn = postgres(process.env.DATABASE_URL!);

async function run() {
  const codes = ["S11388", "S11500", "MO9949", "MO9948", "S46600", "MO7602"];
  
  for (const c of codes) {
    const prices = await sql_conn`SELECT price_scales FROM product_prices WHERE master_code = ${c}`;
    if (prices.length > 0) {
      console.log(`\n\n=== ${c} ===`);
      console.log(JSON.stringify(prices[0].price_scales));
    }
  }
  process.exit(0);
}
run();
