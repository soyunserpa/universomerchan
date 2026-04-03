import { db } from "./src/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "./src/lib/schema";

async function run() {
  const masterCode = "S00578";
  
  // Find product
  const product = await db.query.products.findFirst({
    where: eq(schema.products.masterCode, masterCode),
  });
  
  if (!product) {
    console.log("Product not found");
    return;
  }
  
  // Find variants
  const variants = await db.query.productVariants.findMany({
    where: eq(schema.productVariants.productId, product.id),
  });
  
  console.log("Variants found:", variants.length);
  for (const v of variants.slice(0, 5)) {
    console.log({
      sku: v.sku,
      color: v.colorDescription,
      colorGroup: v.colorGroup,
      colorHexInDb: v.colorHex
    });
  }
}

run().then(() => process.exit(0));
