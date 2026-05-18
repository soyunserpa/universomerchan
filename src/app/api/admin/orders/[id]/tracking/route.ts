import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { requireAuth } from "@/lib/auth-service";
import { logServerException } from "@/lib/error-logger";
import { sendOrderShippedEmail } from "@/lib/email-service";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req.headers.get("authorization"), "admin");

    const orderNumberOrId = params.id;
    const body = await req.json();
    const { trackingNumber, forwarder, trackingUrl } = body;

    if (!trackingNumber) {
      return NextResponse.json({ error: "Falta el número de seguimiento" }, { status: 400 });
    }

    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, orderNumberOrId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update order with tracking details
    await db.update(schema.orders).set({
      status: "shipped",
      trackingNumber,
      forwarder: forwarder || "Agencia",
      trackingUrl: trackingUrl || "",
      updatedAt: new Date(),
      // Midocean automatically updates shippedAt, but for manual tracking we set it here
      shippedAt: new Date().toISOString()
    }).where(eq(schema.orders.id, order.id));

    // Send email notification to client
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, order.userId),
    });

    if (user?.email) {
      try {
        await sendOrderShippedEmail(user.email, {
          orderId: order.id,
          firstName: user.firstName || "Cliente",
          orderNumber: order.orderNumber,
          trackingNumber,
          trackingUrl: trackingUrl || "",
          forwarder: forwarder || "Agencia"
        });
      } catch (err) {
        console.error("Failed to send shipped email:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Seguimiento añadido y correo enviado." });
  } catch (error: any) {
    console.error("Failed to update tracking", error);
    await logServerException(error, { errorType: "server_exception", severity: "medium", url: req.url });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
