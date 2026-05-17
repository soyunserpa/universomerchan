import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req.headers.get("authorization"), "admin");

    const logs = await db.query.emailLog.findMany({
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      limit: 100 // Limit to 100 most recent for performance
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Failed to fetch email logs", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
