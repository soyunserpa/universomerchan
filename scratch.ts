import { db } from "./src/lib/database";
import * as schema from "./src/lib/schema";
import { eq } from "drizzle-orm";

async function run() {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.orderNumber, "UM-2026-0073")
  });
  console.log("midoceanOrderNumber:", order?.midoceanOrderNumber);
  console.log("orderType:", order?.orderType);
  process.exit(0);
}
run();
