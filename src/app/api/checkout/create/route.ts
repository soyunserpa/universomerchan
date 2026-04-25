import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { createOrderFromCart, createCheckoutSession, processFreeOrder } from "@/lib/cart-checkout";
import { updateProfile } from "@/lib/auth-service";
import type { CartItem } from "@/lib/configurator-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, shippingAddress, expressShipping, customerNotes, userId, couponCode, paymentMethod } = body as {
            items: CartItem[];
            shippingAddress: { name: string; company?: string; cif?: string; street: string; postalCode: string; city: string; country: string; email: string; phone: string; };
            expressShipping?: boolean;
            customerNotes?: string;
            userId: number;
            couponCode?: string;
            paymentMethod?: "card" | "transfer";
        };

        if (!items || items.length === 0) return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 });
        if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.email || !shippingAddress.phone) return NextResponse.json({ error: "Dirección de envío incompleta. El teléfono es obligatorio." }, { status: 400 });

        for (const item of items) {
            const stockEntry = await db.query.stock.findFirst({ where: eq(schema.stock.sku, item.variantSku) });
            if (stockEntry && stockEntry.quantity < item.quantity) {
                return NextResponse.json({ error: `Stock insuficiente para ${item.productName} (${item.color}). Disponible: ${stockEntry.quantity} uds`, sku: item.variantSku, available: stockEntry.quantity }, { status: 409 });
            }
        }

        if (userId) {
            try {
                // Background profile update. Splitting full name back.
                const nameParts = shippingAddress.name.split(" ");
                const firstName = nameParts[0];
                const lastName = nameParts.slice(1).join(" ");

                await updateProfile(userId, {
                    firstName: firstName || undefined,
                    lastName: lastName || undefined,
                    phone: shippingAddress.phone || undefined,
                    companyName: shippingAddress.company || undefined,
                    cif: shippingAddress.cif || undefined,
                    shippingStreet: shippingAddress.street || undefined,
                    shippingPostalCode: shippingAddress.postalCode || undefined,
                    shippingCity: shippingAddress.city || undefined,
                    shippingCountry: shippingAddress.country || "ES"
                });
            } catch (pErr) {
                console.error("[API] Checkout background profile update failed:", pErr);
                // Do not block checkout if profile update somehow fails
            }
        }

        const { orderId, orderNumber, finalShippingCost, totalPrice } = await createOrderFromCart({ userId, items, shippingAddress, expressShipping, customerNotes, couponCode });
        
        if (totalPrice <= 0) {
            await processFreeOrder(orderId);
            return NextResponse.json({ success: true, orderNumber, checkoutUrl: `/checkout/success?order=${orderNumber}` });
        }

        const { sessionUrl, sessionId } = await createCheckoutSession({ 
            orderId, 
            orderNumber, 
            customerName: shippingAddress.name, 
            customerEmail: shippingAddress.email, 
            shippingAddress, 
            totalPrice, 
            items, 
            expressShipping: expressShipping || false, 
            couponCode, 
            finalShippingCost, 
            paymentMethod 
        });

        return NextResponse.json({ success: true, orderNumber, checkoutUrl: sessionUrl, sessionId });
    } catch (error: any) {
        console.error("[API] Checkout error:", error);
        return NextResponse.json({ error: "Error al procesar el pago. Inténtalo de nuevo." }, { status: 500 });
    }
}
