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



export async function GET(
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
    const result = await getReorderItems(auth.user.id, parseInt(orderNumber));
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


