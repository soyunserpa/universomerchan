import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { createOrderFromCart, createCheckoutSession } from "@/lib/cart-checkout";
import type { CartItem } from "@/lib/configurator-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, shippingAddress, expressShipping, customerNotes, userId } = body as {
            items: CartItem[];
            shippingAddress: { name: string; company?: string; street: string; postalCode: string; city: string; country: string; email: string; phone: string; };
            expressShipping?: boolean;
            customerNotes?: string;
            userId: number;
        };

        if (!items || items.length === 0) return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
        if (!shippingAddress || !shippingAddress.name || !shippingAddress.street) return NextResponse.json({ error: "Dirección de envío incompleta" }, { status: 400 });

        for (const item of items) {
            const stockEntry = await db.query.stock.findFirst({ where: eq(schema.stock.sku, item.variantSku) });
            if (stockEntry && stockEntry.quantity < item.quantity) {
                return NextResponse.json({ error: `Stock insuficiente para ${item.productName} (${item.color}). Disponible: ${stockEntry.quantity} uds`, sku: item.variantSku, available: stockEntry.quantity }, { status: 409 });
            }
        }

        const { orderId, orderNumber } = await createOrderFromCart({ userId, items, shippingAddress, expressShipping, customerNotes });
        const totalPrice = items.reduce((sum, i) => sum + i.totalPrice, 0);
        const { sessionUrl, sessionId } = await createCheckoutSession({ orderId, orderNumber, customerEmail: shippingAddress.email, totalPrice, items, expressShipping: expressShipping || false });

        return NextResponse.json({ success: true, orderNumber, checkoutUrl: sessionUrl, sessionId });
    } catch (error: any) {
        console.error("[API] Checkout error:", error);
        return NextResponse.json({ error: "Error al procesar el pago. Inténtalo de nuevo." }, { status: 500 });
    }
}
