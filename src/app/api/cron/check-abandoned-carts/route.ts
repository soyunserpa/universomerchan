import { NextResponse } from "next/server";
import { checkAbandonedCarts } from "@/lib/abandoned-cart";

// Esta ruta debe ser invocada periódicamente (ej: cada hora) por un Cron Job.
// N8N o Crontab del servidor: GET https://universomerchan.com/api/cron/check-abandoned-carts

export async function GET(request: Request) {
  // Asegurarnos de que no sea cacheada
  try {
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
