import postgres from "postgres";

const sql = postgres("postgres://universomerchan:V34a6df?6@212.227.90.110:5432/universomerchan");

async function main() {
    const result = await sql`SELECT sku, price_scales FROM variant_prices WHERE price_scales IS NOT NULL LIMIT 5`;
    console.log("Variantes con escalas:", result);

    const productPrices = await sql`SELECT master_code, price_scales FROM product_prices WHERE price_scales IS NOT NULL LIMIT 5`;
    console.log("Productos con escalas:", productPrices);

    process.exit(0);
}

main().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
