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


