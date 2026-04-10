import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);
    return NextResponse.json({ success: true, message: "pg_trgm extension created successfully" });
  } catch (error) {
    console.error("[Setup API Error]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
