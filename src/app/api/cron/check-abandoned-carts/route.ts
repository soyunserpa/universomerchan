import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
import { checkAbandonedCarts } from "@/lib/abandoned-cart";

// Esta ruta debe ser invocada periódicamente (ej: cada hora) por un Cron Job.
// N8N o Crontab del servidor: GET https://universomerchan.com/api/cron/check-abandoned-carts

export async function GET(request: Request) {
  // Asegurarnos de que no sea cacheada
  try {
    // 1. Validar Token de CRON
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

    const stats = await checkAbandonedCarts();
    
    return NextResponse.json({
      success: true,
      data: stats
    }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      }
    });
  } catch (error: any) {
    console.error("[CRON] Cart Recovery failed:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
