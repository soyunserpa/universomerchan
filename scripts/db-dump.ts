import { db } from "../src/lib/db";
import { printPositions } from "../src/lib/schema";
import { ilike } from "drizzle-orm";

async function run() {
  const atoll = await db.query.printPositions.findFirst({
    where: ilike(printPositions.positionDescription, "%ATOLL%")
  });
  if (atoll) {
    console.log("ATOLL Found:", atoll);
  } else {
    const list = await db.select().from(printPositions).limit(5);
    console.log("No ATOLL. Here is a sample:", list);
  }
  process.exit(0);
}
run().catch(console.error);
