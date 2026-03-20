// ============================================================
// UNIVERSO MERCHAN — Admin API Routes
// ============================================================
// Endpoints for admin.universomerchan.com
// ALL require admin JWT authentication.
// These routes run on port 3001, completely separate from
// the customer-facing app on port 3000.
//
// Routes:
//   POST /api/admin/auth/login        — Admin login
//   GET  /api/admin/dashboard/kpis     — Main KPIs
//   GET  /api/admin/dashboard/chart    — Revenue chart data
//   GET  /api/admin/dashboard/top-products — Best sellers
//   GET  /api/admin/dashboard/top-techniques — Print techniques
//   GET  /api/admin/orders             — All orders (filterable)
//   PUT  /api/admin/orders/[id]/notes  — Update admin notes
//   GET  /api/admin/products           — Product management
//   PUT  /api/admin/products/[id]/visibility — Toggle visibility
//   PUT  /api/admin/products/[id]/price — Set custom price
//   GET  /api/admin/clients            — Client management
//   PUT  /api/admin/clients/[id]/discount — Set discount
//   PUT  /api/admin/clients/[id]/active — Toggle active
//   GET  /api/admin/settings           — Get all settings
//   PUT  /api/admin/settings/margins   — Update dual margins
//   PUT  /api/admin/settings/[key]     — Update single setting
//   GET  /api/admin/sync/status        — Sync log
//   POST /api/admin/sync/trigger       — Manually trigger sync
//   GET  /api/admin/errors             — Error log
//   PUT  /api/admin/errors/[id]/resolve — Resolve error
//   GET  /api/admin/catalog/stats      — Catalog statistics
// ============================================================

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
} from "@/lib/admin-dashboard-api";
import {
  syncProducts,
  syncStock,
  syncPricelist,
  syncPrintPricelist,
  syncPrintData,
  runFullSync,
} from "@/lib/sync-engine";

// ============================================================
// HELPER — Validate admin auth on every request
// ============================================================

async function adminAuth(req: NextRequest) {
  return requireAuth(req.headers.get("authorization"), "admin");
}

function unauthorized(auth: { error: string; status: number }) {
  return NextResponse.json({ error: auth.error }, { status: auth.status });
}

// ============================================================
// AUTH
// ============================================================

// POST /api/admin/auth/login
export async function POST_adminLogin(req: NextRequest) {
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

// GET /api/admin/dashboard/kpis
export async function GET_kpis(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const kpis = await getDashboardKPIs();
    return NextResponse.json(kpis);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/admin/dashboard/chart?months=6
export async function GET_chart(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get("months") || "6");

  try {
    const data = await getRevenueChart(months);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/admin/dashboard/top-products
export async function GET_topProducts(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const data = await getTopProducts();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/admin/dashboard/top-techniques
export async function GET_topTechniques(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const data = await getTopTechniques();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// ORDERS
// ============================================================

// GET /api/admin/orders?status=all&search=&page=1
export async function GET_orders(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  const { searchParams } = new URL(req.url);

  try {
    const result = await getAdminOrders({
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "25"),
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/orders/[id]/notes
export async function PUT_orderNotes(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await updateOrderAdminNotes(body.orderId, body.notes);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// PRODUCTS
// ============================================================

// GET /api/admin/products?search=&category=&page=1
export async function GET_products(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  const { searchParams } = new URL(req.url);

  try {
    const result = await getAdminProducts({
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]/visibility
export async function PUT_productVisibility(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await toggleProductVisibility(body.productId, body.visible);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/products/[id]/price
export async function PUT_productPrice(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await setProductCustomPrice(body.productId, body.customPrice);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// CLIENTS
// ============================================================

// GET /api/admin/clients?search=&page=1
export async function GET_clients(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  const { searchParams } = new URL(req.url);

  try {
    const result = await getAdminClients({
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/clients/[id]/discount
export async function PUT_clientDiscount(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await setClientDiscount(body.clientId, body.discountPercent);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/clients/[id]/active
export async function PUT_clientActive(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await toggleClientActive(body.clientId, body.active);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// SETTINGS
// ============================================================

// GET /api/admin/settings
export async function GET_settings(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const settings = await getAdminSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/settings/margins
export async function PUT_margins(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await updateMargins(body.productMarginPct, body.printMarginPct);
    return NextResponse.json({
      success: true,
      message: `Márgenes actualizados: Producto ${body.productMarginPct}% / Marcaje ${body.printMarginPct}%`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/settings/[key]
export async function PUT_setting(req: NextRequest) {
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

// GET /api/admin/sync/status
export async function GET_syncStatus(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const status = await getSyncStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/sync/trigger
export async function POST_triggerSync(req: NextRequest) {
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

// GET /api/admin/errors?resolved=false
export async function GET_errors(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  const { searchParams } = new URL(req.url);
  const resolved = searchParams.get("resolved");

  try {
    const errors = await getErrorLog({
      resolved: resolved === "true" ? true : resolved === "false" ? false : undefined,
      limit: parseInt(searchParams.get("limit") || "50"),
    });
    return NextResponse.json(errors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/errors/[id]/resolve
export async function PUT_resolveError(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const body = await req.json();
    await resolveError(body.errorId, auth.user.id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// CATALOG STATS
// ============================================================

// GET /api/admin/catalog/stats
export async function GET_catalogStats(req: NextRequest) {
  const auth = await adminAuth(req);
  if ("error" in auth) return unauthorized(auth);

  try {
    const stats = await getCatalogStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
