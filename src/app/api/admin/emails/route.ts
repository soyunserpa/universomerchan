import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { desc, sql, eq } from "drizzle-orm";

// GET — Fetch email logs with pagination
export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const type = url.searchParams.get("type") || "";
    const offset = (page - 1) * limit;

    try {
        const whereClause = type
            ? sql`WHERE ${schema.emailLog.emailType} = ${type}`
            : sql``;

        // Get total count
        const countResult = await db.execute(
            sql`SELECT COUNT(*) as total FROM email_log ${whereClause}`
        );
        const total = parseInt((countResult.rows[0] as any)?.total || "0");

        // Get logs
        const logs = await db.execute(
            sql`SELECT * FROM email_log ${whereClause} ORDER BY sent_at DESC LIMIT ${limit} OFFSET ${offset}`
        );

        return NextResponse.json({
            logs: logs.rows,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
