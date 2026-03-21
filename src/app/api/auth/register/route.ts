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


