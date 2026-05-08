import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trafficSessions } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { verifyAdminToken } from "@/lib/auth-server";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.substring(7);
    const decoded = await verifyAdminToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    // Parse query params (e.g., ?days=30)
    const url = new URL(req.url);
    const daysParam = url.searchParams.get("days") || "30";
    const days = parseInt(daysParam, 10);

    // Group traffic by source
    const result = await db
      .select({
        source: trafficSessions.source,
        count: sql<number>`count(*)`,
      })
      .from(trafficSessions)
      .where(sql`${trafficSessions.createdAt} >= NOW() - INTERVAL '${days} days'`)
      .groupBy(trafficSessions.source)
      .orderBy(sql`count(*) DESC`);

    // Calculate total
    const total = result.reduce((acc, row) => acc + Number(row.count), 0);

    // Add percentages
    const dataWithPercentages = result.map(row => ({
      name: row.source,
      value: Number(row.count),
      percentage: total > 0 ? ((Number(row.count) / total) * 100).toFixed(1) : 0
    }));

    return NextResponse.json({ 
      success: true, 
      data: dataWithPercentages,
      total
    });
  } catch (error) {
    console.error("Error fetching traffic analytics:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
