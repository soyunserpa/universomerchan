import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

// GET — Fetch all email templates from admin_settings
export async function GET() {
    try {
        const templates = await db.execute(
            sql`SELECT key, value FROM admin_settings WHERE key LIKE 'email_tpl_%' ORDER BY key`
        );
        return NextResponse.json({ templates: templates.rows });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT — Update a specific email template
export async function PUT(req: NextRequest) {
    try {
        const { key, value } = await req.json();
        if (!key || !value) {
            return NextResponse.json({ error: "key and value required" }, { status: 400 });
        }

        // Upsert: insert or update
        await db.execute(
            sql`INSERT INTO admin_settings (key, value, updated_at) 
          VALUES (${key}, ${value}, NOW()) 
          ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()`
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
