import { NextResponse } from "next/server";
import { getProductList } from "@/lib/catalog-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    
    if (!q || q.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const result = await getProductList({
      search: q,
      limit: 5,
    });

    const slimProducts = result.products.map(p => ({
      masterCode: p.masterCode,
      productName: p.name,
      mainImage: p.mainImage,
      category: p.category,
      startingPriceRaw: p.startingPriceRaw
    }));

    return NextResponse.json({ products: slimProducts });
  } catch (error) {
    console.error("[LiveSearch API Error]", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
