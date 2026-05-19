import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { requireAuth } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get("authorization"));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;

    const favorites = await db
      .select({
        favoriteId: schema.userFavorites.id,
        productId: schema.products.id,
        masterCode: schema.products.masterCode,
        shortDescription: schema.products.shortDescription,
        categoryLevel1: schema.products.categoryLevel1,
        isGreen: schema.products.isGreen,
        digitalAssets: schema.products.digitalAssets,
      })
      .from(schema.userFavorites)
      .innerJoin(schema.products, eq(schema.userFavorites.productId, schema.products.id))
      .where(eq(schema.userFavorites.userId, user.id))
      .orderBy(schema.userFavorites.createdAt);

    // Get an array of just the product IDs so the frontend can quickly check if a product is favorited
    const favoriteProductIds = favorites.map(f => f.productId);

    const formattedFavorites = favorites.map(f => {
      // Extract main image from digitalAssets JSON array
      let mainImage = "";
      if (f.digitalAssets && Array.isArray(f.digitalAssets) && f.digitalAssets.length > 0) {
        mainImage = f.digitalAssets[0].url || "";
      }

      return {
        id: f.productId,
        masterCode: f.masterCode,
        name: f.shortDescription || f.masterCode,
        shortDescription: f.shortDescription || "",
        category: f.categoryLevel1 || "",
        categoryLevel2: "",
        material: "",
        dimensions: "",
        isGreen: f.isGreen || false,
        printable: true,
        startingPrice: "Desde 0.00€",
        startingPriceRaw: 0, // We can skip price loading here to keep it fast, or load from variant_prices
        totalStock: 0,
        mainImage: mainImage,
        variants: [],
        productId: f.productId // For React key
      };
    });

    return NextResponse.json({ favorites: formattedFavorites, favoriteProductIds });
  } catch (error: any) {
    console.error("Failed to fetch favorites:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get("authorization"));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;

    const body = await req.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: "ID de producto requerido" }, { status: 400 });
    }

    // Check if it's already a favorite
    const existing = await db
      .select()
      .from(schema.userFavorites)
      .where(and(
        eq(schema.userFavorites.userId, user.id),
        eq(schema.userFavorites.productId, productId)
      ))
      .limit(1);

    let isFavorite = false;

    if (existing.length > 0) {
      // Remove it
      await db
        .delete(schema.userFavorites)
        .where(eq(schema.userFavorites.id, existing[0].id));
      isFavorite = false;
    } else {
      // Add it
      await db
        .insert(schema.userFavorites)
        .values({
          userId: user.id,
          productId: productId
        });
      isFavorite = true;
    }

    return NextResponse.json({ success: true, isFavorite });
  } catch (error: any) {
    console.error("Failed to toggle favorite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
