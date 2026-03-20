// ============================================================
// UNIVERSO MERCHAN — Customer Account API Routes
// ============================================================
// Next.js API route handlers for the customer's "Mi cuenta":
//   GET  /api/account/orders          — List my orders
//   GET  /api/account/orders/[number] — Order detail
//   POST /api/account/orders/proof    — Approve/reject proof
//   GET  /api/account/orders/[id]/reorder — Get reorder items
//   GET  /api/account/quotes          — List my quotes
//   GET  /api/account/stats           — Account overview stats
//   PUT  /api/account/profile         — Update profile
//   POST /api/auth/register           — Register new customer
//   POST /api/auth/login              — Login (customer)
//   POST /api/auth/reset-password     — Request password reset
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import {
  registerCustomer,
  loginUser,
  requestPasswordReset,
  resetPassword,
  updateProfile,
} from "@/lib/auth-service";
import {
  getCustomerOrders,
  getCustomerOrderDetail,
  customerApproveProof,
  customerRejectProof,
  getCustomerQuotes,
  getReorderItems,
  getCustomerStats,
  buildOrderTimeline,
} from "@/lib/customer-account-api";

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/register
export async function POST_register(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await registerCustomer(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error en el registro" },
      { status: 500 }
    );
  }
}

// POST /api/auth/login
export async function POST_login(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await loginUser(body, "customer");

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error en el inicio de sesión" },
      { status: 500 }
    );
  }
}

// POST /api/auth/reset-password
export async function POST_resetPassword(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.token && body.newPassword) {
      // Step 2: Reset with token
      const result = await resetPassword(body.token, body.newPassword);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: "Contraseña actualizada" });
    }

    if (body.email) {
      // Step 1: Request reset link
      await requestPasswordReset(body.email);
      return NextResponse.json({
        success: true,
        message: "Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña",
      });
    }

    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}

// ============================================================
// ACCOUNT ROUTES (require authentication)
// ============================================================

// GET /api/account/stats
export async function GET_accountStats(req: NextRequest) {
  const auth = await requireAuth(
    req.headers.get("authorization"),
    "customer"
  );
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const stats = await getCustomerStats(auth.user.id);
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener estadísticas" },
      { status: 500 }
    );
  }
}

// GET /api/account/orders?status=all&page=1
export async function GET_orders(req: NextRequest) {
  const auth = await requireAuth(
    req.headers.get("authorization"),
    "customer"
  );
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const page = parseInt(searchParams.get("page") || "1");

    const result = await getCustomerOrders(auth.user.id, { status, page });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener pedidos" },
      { status: 500 }
    );
  }
}

// GET /api/account/orders/[orderNumber]
export async function GET_orderDetail(
  req: NextRequest,
  orderNumber: string
) {
  const auth = await requireAuth(
    req.headers.get("authorization"),
    "customer"
  );
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const order = await getCustomerOrderDetail(auth.user.id, orderNumber);
    if (!order) {
      return NextResponse.json(
        { error: "Pedido no encontrado" },
        { status: 404 }
      );
    }

    const timeline = buildOrderTimeline(order);

    return NextResponse.json({
      order,
      timeline,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener el pedido" },
      { status: 500 }
    );
  }
}

// POST /api/account/orders/proof
export async function POST_proof(req: NextRequest) {
  const auth = await requireAuth(
    req.headers.get("authorization"),
    "customer"
  );
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { orderId, lineId, action, reason } = body;

    if (!orderId || !lineId || !action) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    let result;
    if (action === "approve") {
      result = await customerApproveProof(auth.user.id, orderId, lineId);
    } else if (action === "reject") {
      result = await customerRejectProof(
        auth.user.id,
        orderId,
        lineId,
        reason || ""
      );
    } else {
      return NextResponse.json(
        { error: 'Acción inválida. Usa "approve" o "reject"' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al procesar la acción del boceto" },
      { status: 500 }
    );
  }
}

// GET /api/account/orders/[orderId]/reorder
export async function GET_reorder(
  req: NextRequest,
  orderId: string
) {
  const auth = await requireAuth(
    req.headers.get("authorization"),
    "customer"
  );
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const result = await getReorderItems(auth.user.id, parseInt(orderId));
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ items: result.items });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al preparar el repedido" },
      { status: 500 }
    );
  }
}

// GET /api/account/quotes
export async function GET_quotes(req: NextRequest) {
  const auth = await requireAuth(
    req.headers.get("authorization"),
    "customer"
  );
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const quotes = await getCustomerQuotes(auth.user.id);
    return NextResponse.json({ quotes });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al obtener presupuestos" },
      { status: 500 }
    );
  }
}

// PUT /api/account/profile
export async function PUT_profile(req: NextRequest) {
  const auth = await requireAuth(
    req.headers.get("authorization"),
    "customer"
  );
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const result = await updateProfile(auth.user.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: result.user });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error al actualizar el perfil" },
      { status: 500 }
    );
  }
}
