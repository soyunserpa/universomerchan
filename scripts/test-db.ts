import { db } from '../src/lib/db';
import { orders } from '../src/lib/schema';
import { desc, gte, lt } from 'drizzle-orm';

async function run() {
  const res = await db.select().from(orders)
    .where(gte(orders.createdAt, new Date('2026-05-14T00:00:00Z')))
    .orderBy(desc(orders.createdAt));
  console.log(JSON.stringify(res, null, 2));
  process.exit(0);
}
run();
