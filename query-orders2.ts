import postgres from "postgres";
import "dotenv/config";

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  const orders = await sql`
    SELECT id, order_number, status, total_price, subtotal_product, subtotal_print, margin_product_applied, margin_print_applied, created_at 
    FROM orders 
    ORDER BY created_at DESC LIMIT 5
  `;
  console.log(orders);
  
  for (const o of orders) {
    const lines = await sql`SELECT product_name, quantity, line_total, midocean_cost, midocean_print_cost FROM order_lines WHERE order_id = ${o.id}`;
    console.log(`Order ${o.order_number} lines:`, lines);
  }
  
  process.exit(0);
}
run();
