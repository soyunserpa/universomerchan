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

export async function PUT(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await updateAdminSetting(body.key, body.value);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// SYNC
// ============================================================


