import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { desc, sum } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req.headers.get("authorization"), "admin");
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const topSearches = await db.select({
      query: schema.searchQueries.query,
      count: schema.searchQueries.count,
    })
      .from(schema.searchQueries)
      .orderBy(desc(schema.searchQueries.count), desc(schema.searchQueries.lastSearchedAt))
      .limit(limit);

    // Calculate total searches
    const totalResult = await db.select({ value: sum(schema.searchQueries.count) }).from(schema.searchQueries);
    const totalSearches = totalResult[0]?.value ? parseInt(totalResult[0].value as string) : 0;

    return NextResponse.json({ searches: topSearches, totalSearches });
  } catch (error) {
    console.error("[Admin Searches API Error]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
