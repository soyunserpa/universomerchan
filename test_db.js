const { db } = require('./src/lib/database');
const { products } = require('./src/lib/schema');
const { sql } = require('drizzle-orm');

async function main() {
  const categories = await db.execute(sql`
    SELECT DISTINCT category_level1 FROM products WHERE category_level1 IS NOT NULL LIMIT 10;
  `);
  console.log("Categories:", categories.rows);
  
  const diverseProducts = await db.execute(sql`
    WITH RankedProducts AS (
      SELECT 
        product_name as name, 
        master_code as code, 
        category_level1 as category,
        ROW_NUMBER() OVER(PARTITION BY category_level1 ORDER BY random()) as rn
      FROM products
      WHERE category_level1 IS NOT NULL
    )
    SELECT name, code, category FROM RankedProducts WHERE rn <= 3 LIMIT 40;
  `);
  console.log("Products Count:", diverseProducts.rows.length);
  process.exit(0);
}
main();
