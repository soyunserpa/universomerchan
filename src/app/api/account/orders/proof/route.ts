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



export async function POST(req: NextRequest) {
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


