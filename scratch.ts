import { db } from "./src/lib/database";
import * as schema from "./src/lib/schema";
import { eq } from "drizzle-orm";

async function run() {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.orderNumber, "UM-2026-0073")
  });
  if (!order) {
    console.log("Order not found");
    return;
  }
  
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, order.userId)
  });
  
  console.log("User email:", user?.email);
  
  // @ts-ignore
  await db.insert(schema.emailLog).values({
    recipientEmail: user?.email || "isabel@example.com",
    recipientType: "customer",
    emailType: "proof_ready",
    subject: `Boceto listo: UM-2026-0073`,
    orderId: order.id,
    sentAt: new Date(),
    deliveryStatus: "sent"
  });
  
  console.log("Inserted!");
  process.exit(0);
}
run();
