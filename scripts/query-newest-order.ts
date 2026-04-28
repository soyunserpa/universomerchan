import { db } from "../src/lib/database";
import * as schema from "../src/lib/schema";
import { desc } from "drizzle-orm";

async function run() {
    const latestOrder = await db.query.orders.findFirst({
        orderBy: [desc(schema.orders.id)]
    });

    if (latestOrder) {
        const { eq } = require('drizzle-orm');
        const lines = await db.select().from(schema.orderLines).where(eq(schema.orderLines.orderId, latestOrder.id));
        console.log(JSON.stringify({ ...latestOrder, lines }, null, 2));
    } else {
        console.log("No orders found");
    }
    process.exit(0);
}

run().catch(console.error);
