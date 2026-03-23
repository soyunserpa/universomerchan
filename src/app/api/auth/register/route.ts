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
    
    // Honeypot check for bots
    if (body.website) {
      console.log(`[Auth] Blocked bot registration attempt from email: ${body.email}`);
      return NextResponse.json({
        success: true,
        token: "bot_fake_token",
        user: { id: 0, email: body.email, role: "customer", firstName: body.firstName, lastName: "", discountPercent: 0 }
      });
    }

    const result = await registerCustomer(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // WEBHOOK: Backup the client info onto the User's Google Sheet
    if (process.env.APPS_SCRIPT_EMAIL_URL) {
      fetch(process.env.APPS_SCRIPT_EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "saveClient",
          client: { ...body, id: result.user?.id }
        })
      }).catch(err => console.error("[GoogleSheets Webhook] Fail:", err));
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


