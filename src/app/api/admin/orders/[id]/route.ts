import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET(req: NextRequest, { params }: { params: { orderNumber: string } }) {
  // Simple auth check via headers
  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_SECRET || "admin-secret"}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderNumber } = params;

  try {
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, orderNumber),
      with: {
        user: true,
      }
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const orderLines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, order.id),
      orderBy: schema.orderLines.lineNumber,
    });

    return NextResponse.json({ order, orderLines });
  } catch (error: any) {
    console.error("Failed to fetch order", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
