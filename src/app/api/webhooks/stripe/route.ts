import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { handlePaymentSuccess } from "@/lib/cart-checkout";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2024-06-20" as any,
});

export async function POST(req: NextRequest) {
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
        console.error("[Webhook] Signature verification failed:", err.message);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`[Webhook] Session completed: ${session.id} (status: ${session.payment_status})`);
            
            if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
                await handlePaymentSuccess(session.payment_intent as string, session.id);
            } else if (session.payment_status === "unpaid") {
                // Bank transfer started but funds not received yet.
                const { handlePendingTransfer } = await import("@/lib/cart-checkout");
                await handlePendingTransfer(session.payment_intent as string, session.id);
            }
            break;
        }
        case "checkout.session.async_payment_succeeded": {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log(`[Webhook] Async payment succeeded for session: ${session.id}`);
            await handlePaymentSuccess(session.payment_intent as string, session.id);
            break;
        }
        case "payment_intent.payment_failed": {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            const failedOrder = await db.query.orders.findFirst({
                where: eq(schema.orders.stripePaymentIntentId, paymentIntent.id),
            });
            if (failedOrder) {
                await db.update(schema.orders).set({
                    status: "error",
                    lastError: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown"}`,
                    errorCount: (failedOrder.errorCount || 0) + 1,
                    updatedAt: new Date(),
                }).where(eq(schema.orders.id, failedOrder.id));
            }
            break;
        }
        default:
            console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
