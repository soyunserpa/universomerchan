import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { products, users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

const N8N_SECRET = process.env.N8N_WEBHOOK_SECRET || "n8n_super_secret_universe_123!";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    if (token !== N8N_SECRET) {
      return NextResponse.json({ error: "Invalid authorization token" }, { status: 403 });
    }

    // 1. Fetch active customers to send the email to
    const customerList = await db.select({ email: users.email, firstName: users.firstName })
      .from(users)
      .where(eq(users.role, "customer"));

    // 2. Fetch 15 random visible, printable products
    const candidateProducts = await db.select({
      masterCode: products.masterCode,
      productName: products.productName,
      shortDescription: products.shortDescription,
      digitalAssets: products.digitalAssets,
      categoryLevel1: products.categoryLevel1
    })
    .from(products)
    .where(eq(products.isVisible, true))
    .orderBy(sql`RANDOM()`)
    .limit(15);

    // 3. Filter down to 3 products that have actual images
    const topProducts = [];
    for (const prod of candidateProducts) {
      if (topProducts.length >= 3) break;
      
      let imageUrl = "";
      // Search for a main image in the digital assets array
      if (Array.isArray(prod.digitalAssets) && prod.digitalAssets.length > 0) {
        const mainImage = prod.digitalAssets.find(a => a.type === "image" && a.subtype === "MAIN") 
          || prod.digitalAssets.find(a => a.type === "image")
          || prod.digitalAssets[0]; // agnostico al formato

        if (mainImage) {
          imageUrl = mainImage.url || mainImage.link || mainImage.src || (typeof mainImage === 'string' ? mainImage : "");
        }
      }

      // Añadimos el producto exista su imagen HQ o no temporalmente para no fallar
      topProducts.push({
        masterCode: prod.masterCode,
        productName: prod.productName,
        description: prod.shortDescription,
        category: prod.categoryLevel1,
        imageUrl: imageUrl || "https://universomerchan.com/placeholder.png",
        productUrl: `https://universomerchan.com/catalog/product/${prod.masterCode}`
      });
    }

    return NextResponse.json({
      success: true,
      customers: customerList,
      products: topProducts,
      debugInfo: candidateProducts
    });

  } catch (error: any) {
    console.error("Flyer Data Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
