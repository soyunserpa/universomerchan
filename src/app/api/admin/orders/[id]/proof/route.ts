import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import { db } from "@/lib/database";
import { eq, and } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { notifyClientProofReady } from "@/lib/email-service";
import { logServerException } from "@/lib/error-logger";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth(req.headers.get("authorization"), "admin");
    const { lineId, proofUrl } = await req.json();

    if (!lineId || !proofUrl) {
      return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
    }

    const orderNumberOrId = params.id;

    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, orderNumberOrId),
    });

    if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, order.userId),
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

    let finalUrl = proofUrl;
    if (!finalUrl.includes("?")) finalUrl += "?manual=1";
    else finalUrl += "&manual=1";

    // Actualizar la línea de pedido con el boceto manual
    await db.update(schema.orderLines)
      .set({
        proofUrl: finalUrl,
        proofStatus: "proof_pending"
      })
      .where(and(
        eq(schema.orderLines.id, lineId),
        eq(schema.orderLines.orderId, order.id)
      ));

    // Enviar correo al cliente de "Boceto Listo para Aprobar"
    try {
      await notifyClientProofReady({
        clientName: user.firstName,
        clientEmail: user.email,
        orderNumber: order.orderNumber,
        dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://universomerchan.com'}/account/orders/${order.orderNumber}`
      });
    } catch (e) {
      console.error("No se pudo notificar al cliente del boceto manual", e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Manual proof upload error:", error);
    await logServerException(error, { errorType: "server_exception", severity: "high", url: req.url });
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
