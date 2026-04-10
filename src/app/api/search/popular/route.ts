import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const popular = await db.select({
      query: schema.searchQueries.query,
      count: schema.searchQueries.count
    }).from(schema.searchQueries)
      .orderBy(desc(schema.searchQueries.count), desc(schema.searchQueries.lastSearchedAt))
      .limit(6);

    return NextResponse.json({ 
      popular: popular.map(p => p.query)
    });
  } catch (error) {
    console.error("[Search Popular API Error]", error);
    return NextResponse.json({ popular: [] }, { status: 500 });
  }
}
