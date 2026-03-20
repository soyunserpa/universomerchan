// ============================================================
// UNIVERSO MERCHAN — Cart & Checkout API Routes
// ============================================================
// Next.js API route handlers for:
//   POST /api/cart/sync         — Sync localStorage cart to DB
//   POST /api/checkout/create   — Create Stripe checkout session
//   POST /api/quotes/generate   — Generate PDF quote with buy link
//   GET  /api/quotes/[id]/restore — Restore cart from quote
//   POST /api/webhooks/stripe   — Handle Stripe payment webhooks
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import {
  createOrderFromCart,
  createCheckoutSession,
  handlePaymentSuccess,
} from "@/lib/cart-checkout";
import { generateQuoteNumber, generateBuyUrl } from "@/lib/quote-pdf";
import { sendQuoteEmail } from "@/lib/email-service";
import Stripe from "stripe";
import type { CartItem } from "@/lib/configurator-engine";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

// ============================================================
// POST /api/checkout/create
// Creates order + Stripe checkout session → returns redirect URL
// ============================================================

export async function POST_checkout(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      items,
      shippingAddress,
      expressShipping,
      customerNotes,
      userId,
    } = body as {
      items: CartItem[];
      shippingAddress: {
        name: string;
        company?: string;
        street: string;
        postalCode: string;
        city: string;
        country: string;
        email: string;
        phone: string;
      };
      expressShipping?: boolean;
      customerNotes?: string;
      userId: number;
    };

    // Validate
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El carrito está vacío" },
        { status: 400 }
      );
    }

    if (!shippingAddress || !shippingAddress.name || !shippingAddress.street) {
      return NextResponse.json(
        { error: "Dirección de envío incompleta" },
        { status: 400 }
      );
    }

    // Verify stock availability before creating order
    for (const item of items) {
      const stockEntry = await db.query.stock.findFirst({
        where: eq(schema.stock.sku, item.variantSku),
      });
      if (stockEntry && stockEntry.quantity < item.quantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para ${item.productName} (${item.color}). Disponible: ${stockEntry.quantity} uds`,
            sku: item.variantSku,
            available: stockEntry.quantity,
          },
          { status: 409 }
        );
      }
    }

    // Create order in our DB (status: draft)
    const { orderId, orderNumber } = await createOrderFromCart({
      userId,
      items,
      shippingAddress,
      expressShipping,
      customerNotes,
    });

    // Create Stripe checkout session
    const totalPrice = items.reduce((sum, i) => sum + i.totalPrice, 0);
    const { sessionUrl, sessionId } = await createCheckoutSession({
      orderId,
      orderNumber,
      customerEmail: shippingAddress.email,
      totalPrice,
      items,
    });

    return NextResponse.json({
      success: true,
      orderNumber,
      checkoutUrl: sessionUrl,
      sessionId,
    });
  } catch (error: any) {
    console.error("[API] Checkout error:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago. Inténtalo de nuevo." },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/webhooks/stripe
// Handles Stripe webhook events
// ============================================================

export async function POST_stripeWebhook(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Webhook] Payment completed: ${session.id}`);

      await handlePaymentSuccess(
        session.payment_intent as string,
        session.id
      );
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error(
        `[Webhook] Payment failed: ${paymentIntent.id}`,
        paymentIntent.last_payment_error?.message
      );

      // Find and update order
      const failedOrder = await db.query.orders.findFirst({
        where: eq(
          schema.orders.stripePaymentIntentId,
          paymentIntent.id
        ),
      });
      if (failedOrder) {
        await db
          .update(schema.orders)
          .set({
            status: "error",
            lastError: `Payment failed: ${paymentIntent.last_payment_error?.message || "Unknown error"}`,
            errorCount: (failedOrder.errorCount || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(schema.orders.id, failedOrder.id));
      }
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// ============================================================
// POST /api/quotes/generate
// Creates a PDF quote and sends it by email
// ============================================================

export async function POST_generateQuote(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, userId, guestEmail } = body as {
      items: CartItem[];
      userId?: number;
      guestEmail?: string;
    };

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "No hay productos para presupuestar" },
        { status: 400 }
      );
    }

    const email = guestEmail || (userId
      ? (await db.query.users.findFirst({ where: eq(schema.users.id, userId) }))?.email
      : null);

    if (!email) {
      return NextResponse.json(
        { error: "Se necesita un email para enviar el presupuesto" },
        { status: 400 }
      );
    }

    // Get next sequential ID
    const countResult = await db
      .select({ count: schema.quotes.id })
      .from(schema.quotes)
      .limit(1);
    const nextId = (countResult.length || 0) + 1;
    const quoteNumber = generateQuoteNumber(nextId);
    const buyUrl = generateBuyUrl(quoteNumber);

    // Validity: 15 days
    const validityDays = 15;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validityDays);

    const totalPrice = items.reduce((sum, i) => sum + i.totalPrice, 0);

    // Save quote to DB
    await db.insert(schema.quotes).values({
      quoteNumber,
      userId: userId || null,
      guestEmail: !userId ? email : null,
      cartSnapshot: items as any,
      totalPrice: String(totalPrice),
      expiresAt,
      createdAt: new Date(),
    });

    // Get user name
    let clientName = "Cliente";
    let clientCompany: string | undefined;
    if (userId) {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      if (user) {
        clientName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        clientCompany = user.companyName || undefined;
      }
    }

    // Send email with quote
    await sendQuoteEmail(email, {
      firstName: clientName.split(" ")[0] || "Cliente",
      quoteNumber,
      totalPrice: `${totalPrice.toFixed(2)} €`,
      pdfUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/quotes/${quoteNumber}/pdf`,
      buyUrl,
      expiresDate: expiresAt.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    });

    return NextResponse.json({
      success: true,
      quoteNumber,
      buyUrl,
      pdfUrl: `/api/quotes/${quoteNumber}/pdf`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[API] Quote generation error:", error);
    return NextResponse.json(
      { error: "Error al generar el presupuesto" },
      { status: 500 }
    );
  }
}

// ============================================================
// GET /api/quotes/[quoteNumber]/restore
// Returns the cart items from a saved quote (for the buy link)
// ============================================================

export async function GET_restoreQuote(
  req: NextRequest,
  quoteNumber: string
) {
  try {
    const quote = await db.query.quotes.findFirst({
      where: eq(schema.quotes.quoteNumber, quoteNumber),
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Presupuesto no encontrado" },
        { status: 404 }
      );
    }

    // Check expiry
    if (quote.expiresAt && new Date() > new Date(quote.expiresAt)) {
      return NextResponse.json(
        { error: "Este presupuesto ha expirado. Solicita uno nuevo." },
        { status: 410 }
      );
    }

    // Check if already converted to order
    if (quote.convertedToOrderId) {
      return NextResponse.json(
        {
          error: "Este presupuesto ya fue convertido en un pedido.",
          orderNumber: quote.convertedToOrderId,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      quoteNumber: quote.quoteNumber,
      items: quote.cartSnapshot,
      totalPrice: quote.totalPrice,
      expiresAt: quote.expiresAt,
    });
  } catch (error: any) {
    console.error("[API] Quote restore error:", error);
    return NextResponse.json(
      { error: "Error al recuperar el presupuesto" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/orders/[orderId]/proof
// Handle proof approval/rejection from customer's account
// ============================================================

export async function POST_proofAction(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, lineId, action, reason } = body as {
      orderId: number;
      lineId: number;
      action: "approve" | "reject";
      reason?: string;
    };

    const { handleProofApproval } = await import("@/lib/cart-checkout");

    await handleProofApproval(
      orderId,
      lineId,
      action === "approve",
      reason
    );

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Boceto aprobado. Tu pedido entra en producción."
          : "Boceto rechazado. Midocean preparará una nueva versión.",
    });
  } catch (error: any) {
    console.error("[API] Proof action error:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la acción" },
      { status: 500 }
    );
  }
}
