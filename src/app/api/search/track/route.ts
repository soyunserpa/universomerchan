import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Invalid query" }, { status: 400 });
    }

    const trimmed = query.trim().toLowerCase();
    
    // Only track meaningful multi-letter searches
    if (trimmed.length < 3) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // Insert or increment if already exists
    await db.insert(schema.searchQueries).values({
      query: trimmed,
      count: 1
    }).onConflictDoUpdate({
      target: schema.searchQueries.query,
      set: {
        count: sql`${schema.searchQueries.count} + 1`,
        lastSearchedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Search Track API Error]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
