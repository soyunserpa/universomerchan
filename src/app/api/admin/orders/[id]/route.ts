import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { requireAuth } from "@/lib/auth-service";
import { logServerException } from "@/lib/error-logger";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Correctly use the JWT auth service
    await requireAuth(req.headers.get("authorization"), "admin");

    const orderNumberOrId = params.id;

    // Search by orderNumber since the admin UI passes the orderNumber (e.g., UM-2026-0073)
    const order = await db.query.orders.findFirst({
      where: eq(schema.orders.orderNumber, orderNumberOrId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Fetch the user manually since Drizzle relations might not be explicitly configured
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, order.userId),
    });

    const fullOrder = { ...order, user };

    const orderLines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, order.id),
      orderBy: schema.orderLines.lineNumber,
    });

    let emailLogs: any[] = [];
    if (user?.email) {
      try {
        // Fetch all emails sent to this user
        emailLogs = await db.query.emailLog.findMany({
          where: eq(schema.emailLog.recipientEmail, user.email),
          orderBy: (fields, { desc }) => [desc(fields.createdAt)],
        });
      } catch (e) {
        console.error("Failed to fetch email logs, skipping:", e);
        // Do not crash the entire order view if email logs fail
      }
    }

    return NextResponse.json({ order: fullOrder, orderLines, emailLogs });
  } catch (error: any) {
    console.error("Failed to fetch order", error);
    await logServerException(error, { errorType: "server_exception", severity: "medium", url: req.url });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
