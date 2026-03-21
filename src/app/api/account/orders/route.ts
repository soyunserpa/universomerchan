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



export async function GET(req: NextRequest) {
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


