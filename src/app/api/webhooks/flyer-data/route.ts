import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { products, users, adminSettings } from "@/lib/schema";
import { eq, sql, and, notInArray } from "drizzle-orm";

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

    // 1.5 Fetch Flyer History to prevent repetition (last 15 items config)
    const historySetting = await db.select().from(adminSettings).where(eq(adminSettings.key, "flyer_history"));
    let historicalCodes: string[] = [];
    if (historySetting.length > 0) {
       try { historicalCodes = JSON.parse(historySetting[0].value) || []; } catch(e){}
    }

    // 2. Fetch 15 random visible products, explicitly EXCLUDING historical ones
    const productFilter = historicalCodes.length > 0 
      ? and(eq(products.isVisible, true), notInArray(products.masterCode, historicalCodes))
      : eq(products.isVisible, true);

    const candidateProducts = await db.select({
      masterCode: products.masterCode,
      productName: products.productName,
      shortDescription: products.shortDescription,
      digitalAssets: products.digitalAssets,
      rawApiData: products.rawApiData,
      categoryLevel1: products.categoryLevel1
    })
    .from(products)
    .where(productFilter)
    .orderBy(sql`RANDOM()`)
    .limit(15);

    // 3. Filter down to 3 products that have actual images
    const topProducts = [];
    for (const prod of candidateProducts) {
      if (topProducts.length >= 3) break;
      
      let imageUrl = "";
      
      // Search for a main image in the digital assets array
      if (Array.isArray(prod.digitalAssets) && prod.digitalAssets.length > 0) {
        const mainImage = prod.digitalAssets.find((a: any) => a.type === "image" && a.subtype === "MAIN") 
          || prod.digitalAssets.find((a: any) => a.type === "image");

        if (mainImage) {
          imageUrl = mainImage.url || mainImage.link || mainImage.src || (typeof mainImage === 'string' ? mainImage : "");
        }
      }

      // Fallback: extract from rawApiData
      if (!imageUrl && prod.rawApiData && typeof prod.rawApiData === 'object') {
          const raw = prod.rawApiData as any;
          if (Array.isArray(raw.images) && raw.images.length > 0) {
              const mainImg = raw.images.find((i: any) => i.is_main) || raw.images[0];
              imageUrl = mainImg.url || mainImg.url_highres || "";
          } else if (Array.isArray(raw.digital_assets) && raw.digital_assets.length > 0) {
              const mainImg = raw.digital_assets.find((a: any) => a.type === "image" && a.subtype === "MAIN") || raw.digital_assets.find((a: any) => a.type === "image");
              if (mainImg) imageUrl = mainImg.url || mainImg.url_highress || mainImg.src || "";
          }
          
          if (!imageUrl && Array.isArray(raw.variants) && raw.variants.length > 0) {
              for (const variant of raw.variants) {
                  if (Array.isArray(variant.digital_assets) && variant.digital_assets.length > 0) {
                      const mainImg = variant.digital_assets.find((a: any) => a.type === "image" && a.subtype === "item_picture_front") 
                        || variant.digital_assets.find((a: any) => a.type === "image");
                      if (mainImg) {
                          imageUrl = mainImg.url || mainImg.url_highress || "";
                          break;
                      }
                  }
              }
          }
      }

      // Skip invalid images
      if (!imageUrl || imageUrl.trim() === '' || imageUrl.toLowerCase().endsWith('.eps') || imageUrl.toLowerCase().endsWith('.pdf')) {
        continue;
      }
      
      if (imageUrl.startsWith('//')) {
        imageUrl = 'https:' + imageUrl;
      }

      topProducts.push({
        masterCode: prod.masterCode,
        productName: prod.productName,
        description: prod.shortDescription,
        category: prod.categoryLevel1,
        imageUrl: imageUrl,
        productUrl: `https://universomerchan.com/catalog/product/${prod.masterCode}`
      });
    }

    // 4. Save newly selected products to memory (Keep max 15 to allow 5 weeks of rotation)
    if (topProducts.length > 0) {
      const newChosenCodes = topProducts.map(p => p.masterCode);
      const updatedHistory = [...newChosenCodes, ...historicalCodes].slice(0, 15);
      
      await db.insert(adminSettings)
        .values({
           key: "flyer_history",
           value: JSON.stringify(updatedHistory),
           description: "Historial de productos del flyer para evitar repetidos semanales"
        })
        .onConflictDoUpdate({
           target: adminSettings.key,
           set: { value: JSON.stringify(updatedHistory), updatedAt: new Date() }
        });
    }

    return NextResponse.json({
      success: true,
      customers: customerList,
      products: topProducts,
      debugInfo: { candidateCount: candidateProducts.length, excluded: historicalCodes }
    });

  } catch (error: any) {
    console.error("Flyer Data Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
