import { db } from "../src/lib/database";
import * as schema from "../src/lib/schema";
import { eq } from "drizzle-orm";

async function main() {
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, "contact@petitateliergraphique.fr"),
  });

  if (!user) {
    console.log("User not found");
    return;
  }

  const orders = await db.query.orders.findMany({
    where: eq(schema.orders.userId, user.id),
  });

  for (const o of orders) {
    console.log(`Order ${o.id} - Status: ${o.status} - CreatedAt: ${o.createdAt}`);
  }
}

main();
