require('dotenv').config();
const { db } = require('./src/lib/database');
const { adminSettings } = require('./src/lib/schema');
const { eq } = require('drizzle-orm');

async function run() {
  const settings = await db.select().from(adminSettings);
  console.log("Current adminSettings:");
  console.log(settings);

  // Update margin_print_pct to 40
  await db.update(adminSettings).set({ value: "40" }).where(eq(adminSettings.key, "margin_print_pct"));
  await db.update(adminSettings).set({ value: "40" }).where(eq(adminSettings.key, "margin_product_pct"));
  
  console.log("Updated margins in DB");
  process.exit(0);
}
run();
