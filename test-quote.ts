import { db } from "./src/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "./src/lib/schema";

async function main() {
    const quote = await db.query.quotes.findFirst({
        where: eq(schema.quotes.quoteNumber, "PRE-2026-26448"),
    });
    console.log("quote.cartSnapshot is Array:", Array.isArray(quote?.cartSnapshot));
    console.log("typeof cartSnapshot:", typeof quote?.cartSnapshot);
    if (typeof quote?.cartSnapshot === "string") {
       console.log("String starts with:", quote?.cartSnapshot.substring(0, 50));
    }
    process.exit(0);
}
main();
