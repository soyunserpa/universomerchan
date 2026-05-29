import 'dotenv/config';
import { db } from './src/lib/database';
import { products } from './src/lib/schema';
import { eq } from 'drizzle-orm';
async function run() {
  const p = await db.query.products.findFirst({ where: eq(products.masterCode, 'S11500') });
  console.log(JSON.stringify(p.printPositions, null, 2));
  process.exit(0);
}
run();
