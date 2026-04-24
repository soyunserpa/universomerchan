import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { sendCartAbandonedEmail } from "@/lib/email-service";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "No email provided" }, { status: 400 });

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

  try {
    const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) });
    if (!user) return NextResponse.json({ error: "No user found" }, { status: 404 });
    
    const order = await db.query.orders.findFirst({ where: eq(schema.orders.userId, user.id) });
    if (!order) return NextResponse.json({ error: "No order found" }, { status: 404 });

    const lines = await db.query.orderLines.findMany({ where: eq(schema.orderLines.orderId, order.id) });
    const items = lines.map(l => ({
      name: l.productName || "Producto",
      price: parseFloat(l.lineTotal?.toString() || "0").toFixed(2) + " €"
    }));
    const totalPrice = parseFloat(order.totalPrice?.toString() || "0").toFixed(2) + " €";

    const sent = await sendCartAbandonedEmail(user.email, {
      orderId: order.id,
      firstName: user.firstName || "Cliente",
      items,
      totalPrice,
      cartUrl: `${SITE_URL}/cart?restore=${order.orderNumber}`,
    });

    return NextResponse.json({ success: sent, message: "Forced email to " + email });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
