import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
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



export async function GET(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  const orderNumber = params.orderNumber;

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
export async function DELETE(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  const orderNumber = params.orderNumber;

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

    if (order.status !== "draft" && order.status !== "pending_payment") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar pedidos en borrador o pendientes de pago" },
        { status: 400 }
      );
    }

    // Delete order lines first to be safe
    await db.delete(schema.orderLines).where(eq(schema.orderLines.orderId, order.id));
    // Delete the order itself
    await db.delete(schema.orders).where(eq(schema.orders.id, order.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API] Error deleting order:", error);
    return NextResponse.json(
      { error: "Error interno al eliminar el pedido" },
      { status: 500 }
    );
  }
}

