import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { checkExpiringQuotes } from "@/lib/quote-reminders";

// Invocar 1 vez al día desde el crontab del servidor:
//   GET https://universomerchan.com/api/cron/quote-reminders
//   Header: Authorization: Bearer <CRON_SECRET>

export async function GET(request: Request) {
  try {
    // 1. Validar token de CRON (mismo patrón que el resto de crons)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const token = authHeader.split(" ")[1];
      if (token !== (process.env.CRON_SECRET || "***REMOVED***")) {
        return NextResponse.json({ error: "Invalid authorization token" }, { status: 403 });
      }
    }

    const stats = await checkExpiringQuotes();

    return NextResponse.json(
      { success: true, data: stats },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error: any) {
    console.error("[CRON] Quote reminders failed:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
