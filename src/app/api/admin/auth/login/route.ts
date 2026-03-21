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
  try {
    const body = await req.json();
    const result = await loginUser(body, "admin");

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Error de autenticación" }, { status: 500 });
  }
}

// ============================================================
// DASHBOARD KPIs
// ============================================================


