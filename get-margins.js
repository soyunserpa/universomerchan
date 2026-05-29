require('dotenv').config();
const { db } = require('./src/lib/database');
const { adminSettings } = require('./src/lib/schema');
const { eq } = require('drizzle-orm');

async function run() {
  const settings = await db.select().from(adminSettings);
  console.log("Current adminSettings:");
  console.log(settings);
  process.exit(0);
}
run();
