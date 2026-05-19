import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { requireAuth } from "@/lib/auth-service";
import { getProductList } from "@/lib/catalog-api";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get("authorization"));
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const user = auth.user;

    // Fetch the base favorite IDs and Master Codes to know what to load
    const favoritesBase = await db
      .select({
        productId: schema.products.id,
        masterCode: schema.products.masterCode,
      })
      .from(schema.userFavorites)
      .innerJoin(schema.products, eq(schema.userFavorites.productId, schema.products.id))
      .where(eq(schema.userFavorites.userId, user.id))
      .orderBy(desc(schema.userFavorites.createdAt));

    const favoriteProductIds = favoritesBase.map(f => f.productId);
    const masterCodes = favoritesBase.map(f => f.masterCode);

    let formattedFavorites: any[] = [];
    
    if (masterCodes.length > 0) {
      // Use the robust catalog-api to load FULL product data (prices, stock, images, variants)
      const result = await getProductList({ masterCodes, limit: masterCodes.length });
      
      // Preserve the descending creation order
      const productMap = new Map(result.products.map(p => [p.masterCode, p]));
      formattedFavorites = masterCodes.map(code => productMap.get(code)).filter(Boolean);
    }

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
