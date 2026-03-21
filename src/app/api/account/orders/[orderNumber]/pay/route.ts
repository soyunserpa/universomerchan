import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { createCheckoutSession } from "@/lib/cart-checkout";
import { verifyJwt } from "@/lib/jwt";
import type { CartItem } from "@/lib/configurator-engine";

export async function POST(
    req: NextRequest,
    { params }: { params: { orderNumber: string } }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const payload = await verifyJwt(token);
        if (!payload?.userId) {
            return NextResponse.json({ error: "Token inválido" }, { status: 401 });
        }

        const { orderNumber } = params;

        // Fetch the order and its lines
        const order = await db.query.orders.findFirst({
            where: eq(schema.orders.orderNumber, orderNumber),
            with: {
                lines: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Security check
        if (order.userId !== payload.userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Must be in a playable state
        if (order.status !== "draft" && order.status !== "pending_payment") {
            return NextResponse.json({ error: "El pedido ya está pagado o procesado" }, { status: 400 });
        }

        // Ensure we have total price to pay
        const totalPrice = Number(order.totalPrice);
        if (totalPrice <= 0) {
            return NextResponse.json({ error: "Pedido sin importe" }, { status: 400 });
        }

        // Map order.lines back to CartItem shape expected by createCheckoutSession
        const itemsForStripe: any[] = order.lines.map(line => ({
            productName: line.productName,
            color: line.color,
            productImage: line.productImage,
            unitPriceTotal: Number(line.unitPrice),
            quantity: line.quantity,
            customization: line.customizationSummary ? {
                positions: [{ techniqueName: line.customizationSummary }]
            } : undefined
        }));

        // Generate new checkout session
        const { sessionUrl, sessionId } = await createCheckoutSession({
            orderId: order.id,
            orderNumber: order.orderNumber,
            customerEmail: order.shippingEmail || payload.email || "not-provided@example.com",
            totalPrice: totalPrice,
            items: itemsForStripe,
            expressShipping: order.expressShipping || false,
        });

        return NextResponse.json({ success: true, checkoutUrl: sessionUrl, sessionId });
    } catch (error: any) {
        console.error("[API] Order Pay Error:", error);
        return NextResponse.json({ error: "Error interno al reanudar el pago" }, { status: 500 });
    }
}
