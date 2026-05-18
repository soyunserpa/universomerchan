import { db } from "../src/lib/database";
import * as schema from "../src/lib/schema";
import { desc } from "drizzle-orm";

async function main() {
  const errs = await db.query.errorLog.findMany({
    orderBy: [desc(schema.errorLog.timestamp)],
    limit: 5
  });
  console.log(JSON.stringify(errs, null, 2));
  process.exit(0);
}
main();
