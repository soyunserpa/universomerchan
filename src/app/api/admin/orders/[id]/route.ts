import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { requireAuth } from "@/lib/auth-service";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Correctly use the JWT auth service
    await requireAuth(req.headers.get("authorization"), "admin");

    const orderNumberOrId = params.id;

    // Search by orderNumber since the admin UI passes the orderNumber (e.g., UM-2026-0073)
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, orderNumberOrId),
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
