import { NextRequest, NextResponse } from "next/server";
import { requireAuth, loginUser } from "@/lib/auth-service";
import {
  getDashboardKPIs,
  getRevenueChart,
  getTopProducts,
  getTopTechniques,
  getAdminOrders,
  updateOrderAdminNotes,
  getAdminProducts,
  toggleProductVisibility,
  setProductCustomPrice,
  getAdminClients,
  setClientDiscount,
  toggleClientActive,
  getAdminSettings,
  updateAdminSetting,
  updateMargins,
  getSyncStatus,
  getErrorLog,
  resolveError,
  getCatalogStats,
  getAdminQuotes,
} from "@/lib/admin-dashboard-api";
import {
  syncProducts,
  syncStock,
  syncPricelist,
  syncPrintPricelist,
  syncPrintData,
  runFullSync,
} from "@/lib/sync-engine";


async function adminAuth(req: NextRequest) {
  return requireAuth(req.headers.get("authorization"), "admin");
}

function unauthorized(auth: { error: string; status: number }) {
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}

export async function POST(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    const syncType = body.type || "full";

    // Run sync in background (don't block the response)
    const syncPromise = (async () => {
      switch (syncType) {
        case "stock": await syncStock(); break;
        case "products": await syncProducts(); break;
        case "pricelist": await syncPricelist(); break;
        case "print_pricelist": await syncPrintPricelist(); break;
        case "print_data": await syncPrintData(); break;
        case "full": await runFullSync(); break;
      }
    })();

    // Don't await — let it run in background
    syncPromise.catch((err) => {
      console.error(`[Admin] Manual sync (${syncType}) failed:`, err.message);
    });

    return NextResponse.json({
      success: true,
      message: `Sincronización "${syncType}" iniciada. Revisa el log de sync para ver el progreso.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// ERRORS
// ============================================================


