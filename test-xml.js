const { db } = require('./src/lib/database');
const schema = require('./src/lib/schema');
const { eq } = require('drizzle-orm');

async function run() {
  const result = await db
      .select({
        id: schema.products.masterCode,
        title: schema.products.productName,
      })
      .from(schema.products)
      .where(eq(schema.products.isVisible, true));
  console.log("Visible products:", result.length);
  process.exit(0);
}
run();
