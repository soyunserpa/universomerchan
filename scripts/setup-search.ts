import { db } from "../src/lib/database";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Enabling pg_trgm extension...");
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
        console.log("Successfully enabled pg_trgm extension");
        process.exit(0);
    } catch(e) {
        console.error("Error setting up search:", e);
        process.exit(1);
    }
}
main();
