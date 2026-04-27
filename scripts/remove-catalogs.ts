import { db } from "../src/lib/database";
import * as schema from "../src/lib/schema";
import { ilike, or, eq, like } from "drizzle-orm";

async function run() {
    console.log("Looking for Midocean physical catalogs...");
    const allProducts = await db.query.products.findMany();
    const catalogs = allProducts.filter(p => {
        const name = p.name || "";
        const code = p.masterCode || "";
        return (name.toLowerCase().includes("cat ") && (name.toLowerCase().includes("with prices") || name.toLowerCase().includes("without prices"))) ||
        code.startsWith("G26") ||
        name.startsWith("ST GIFTS") ||
        (name.toLowerCase().includes("spanish") && name.toLowerCase().includes("cat"));
    });

    console.log(`Found ${catalogs.length} products to remove.`);

    for (const p of catalogs) {
        console.log(`Removing ${p.masterCode} - ${p.name}`);
        // Delete related records without cascade
        await db.delete(schema.productPrices).where(eq(schema.productPrices.masterCode, p.masterCode)).catch(() => {});
        await db.delete(schema.variantPrices).where(eq(schema.variantPrices.masterCode, p.masterCode)).catch(() => {});
        await db.delete(schema.printPositions).where(eq(schema.printPositions.masterCode, p.masterCode)).catch(() => {});
        await db.delete(schema.printManipulations).where(eq(schema.printManipulations.masterCode, p.masterCode)).catch(() => {});
        // Variants have cascade but just in case
        await db.delete(schema.productVariants).where(eq(schema.productVariants.productId, p.id)).catch(() => {});
        // Delete product
        await db.delete(schema.products).where(eq(schema.products.id, p.id));
    }
    console.log("Done!");
    process.exit(0);
}

run().catch(console.error);
