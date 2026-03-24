import { db } from "../lib/database";
import { printPositions } from "../lib/schema";
import { ilike } from "drizzle-orm";

async function run() {
  const atoll = await db.query.printPositions.findFirst({
    where: ilike(printPositions.positionDescription, "%ATOLL%")
  });
  if (atoll) {
    console.log("ATOLL Position:");
    console.log("Points:", atoll.positionPoints);
    console.log("Blank:", atoll.positionImageBlank);
    console.log("WithArea:", atoll.printPositionImage);
  } else {
    const list = await db.select().from(printPositions).orderBy(printPositions.id).limit(2);
    console.dir(list, { depth: null });
  }
  process.exit(0);
}
run().catch(console.error);
