import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, "UM-2026-0073")
    });
    if (!order) return NextResponse.json({ error: "Order not found" });
    
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, order.userId)
    });
    
    // @ts-ignore
    await db.insert(schema.emailLog).values({
      recipientEmail: user?.email || "isabel.fernandez@materna.com",
      recipientType: "customer",
      emailType: "proof_ready",
      subject: `Boceto listo: UM-2026-0073`,
      orderId: order.id,
      sentAt: new Date(Date.now() - 3600000), // 1 hour ago approx
      deliveryStatus: "sent"
    });
    
    return NextResponse.json({ success: true, message: "Historial de Isabel añadido correctamente. Puedes volver a cargar la pagina del pedido." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message });
  }
}
