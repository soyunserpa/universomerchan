import { db } from "../src/lib/database";
import { sql } from "drizzle-orm";

async function main() {
  try {
    await db.execute(sql`ALTER TABLE email_log ADD COLUMN IF NOT EXISTS body_html text;`);
    console.log("Migration successful");
  } catch (e) {
    console.error("Migration failed:", e);
  }
  process.exit(0);
}
main();
