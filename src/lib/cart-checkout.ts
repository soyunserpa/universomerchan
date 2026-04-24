// ============================================================
// UNIVERSO MERCHAN — Cart & Checkout Service
// ============================================================
// Manages the full purchase flow:
//   1. Cart persistence (DB-backed, survives sessions)
//   2. Stripe Checkout session creation
//   3. Payment confirmation webhook handling
//   4. Order submission to Midocean Order Entry API
//   5. Email notifications trigger
// ============================================================

import Stripe from "stripe";
import { db } from "./database";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";
import * as midoceanApi from "./midocean-api";
import * as emails from "./email-service";
import { type CartItem, cartItemToMidoceanOrderLine } from "./configurator-engine";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20" as any,
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

// ============================================================
// GENERATE ORDER NUMBER — UM-YYYY-XXXX
// ============================================================

async function generateOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(sql`EXTRACT(YEAR FROM ${schema.orders.createdAt}) = ${year}`);

  const seq = Number(result[0].count) + 1;
  return `UM-${year}-${String(seq).padStart(4, "0")}`;
}

// ============================================================
// CREATE ORDER (draft) from cart items
// ============================================================

export async function createOrderFromCart(params: {
  userId: number;
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
  couponCode?: string;
}): Promise<{ orderId: number; orderNumber: string; finalShippingCost: number; totalPrice: number }> {
  const { userId, items, shippingAddress, expressShipping, customerNotes, couponCode } = params;

  // Get user for discount
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
  const discountPct = parseFloat(user?.discountPercent?.toString() || "0");

  // Get margin settings
  const marginProdSetting = await db.query.adminSettings.findFirst({
    where: eq(schema.adminSettings.key, "margin_product_pct"),
  });
  const marginPrintSetting = await db.query.adminSettings.findFirst({
    where: eq(schema.adminSettings.key, "margin_print_pct"),
  });

  const marginProd = parseFloat(marginProdSetting?.value || "40");
  const marginPrint = parseFloat(marginPrintSetting?.value || "50");

  // Calculate totals
  const hasCustomization = items.some(i => i.orderType === "PRINT");
  const orderType = hasCustomization ? "PRINT" : "NORMAL";

  let subtotalProduct = 0;
  let subtotalPrint = 0;
  for (const item of items) {
    subtotalProduct += item.unitPriceProduct * item.quantity;
    if (item.customization) {
      subtotalPrint += item.totalPrice - (item.unitPriceProduct * item.quantity);
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);
  
  let discountAmount = 0;
  let finalCouponCode: string | null = null;
  const userDiscountPct = parseFloat(user?.discountPercent?.toString() || "0");
  
  let baseShippingCost = expressShipping ? 8.00 : 0.00;
  let finalShippingCost = baseShippingCost;

  if (couponCode) {
    const coupon = await db.query.coupons.findFirst({ where: eq(schema.coupons.code, couponCode.toUpperCase().trim()) });
    const isCouponValid = coupon && coupon.isActive && 
      (!coupon.expiresAt || new Date(coupon.expiresAt) > new Date()) && 
      (!coupon.usageLimit || coupon.usageCount < coupon.usageLimit);

    if (isCouponValid) {
      finalCouponCode = coupon.code;
      if (coupon.discountType === "percentage") {
        const perc = parseFloat(coupon.discountValue.toString()) / 100;
        discountAmount = subtotal * perc;
        finalShippingCost = baseShippingCost * (1 - perc);
      } else {
        const fixedValue = parseFloat(coupon.discountValue.toString());
        discountAmount = Math.min(fixedValue, subtotal);
        if (fixedValue > subtotal) {
          const leftOver = fixedValue - subtotal;
          finalShippingCost = Math.max(0, baseShippingCost - leftOver);
        }
      }
      if (coupon.freeShipping) {
        finalShippingCost = 0;
      }
    } else {
      discountAmount = subtotal * (userDiscountPct / 100);
      finalShippingCost = baseShippingCost * (1 - userDiscountPct / 100);
    }
  } else {
    discountAmount = subtotal * (userDiscountPct / 100);
    finalShippingCost = baseShippingCost * (1 - userDiscountPct / 100);
  }

  const totalPrice = subtotal - discountAmount + finalShippingCost;

  const orderNumber = await generateOrderNumber();

  // Insert order
  const [order] = await db.insert(schema.orders).values({
    orderNumber,
    userId,
    status: "draft",
    orderType: orderType as any,
    subtotalProduct: String(subtotalProduct),
    subtotalPrint: String(subtotalPrint),
    marginProductApplied: String(marginProd),
    marginPrintApplied: String(marginPrint),
    couponCode: finalCouponCode,
    discountApplied: String(discountAmount),
    shippingCost: String(finalShippingCost),
    totalPrice: String(totalPrice),
    shippingName: shippingAddress.name,
    shippingCompany: shippingAddress.company || null,
    shippingStreet: shippingAddress.street,
    shippingPostalCode: shippingAddress.postalCode,
    shippingCity: shippingAddress.city,
    shippingCountry: shippingAddress.country,
    shippingEmail: shippingAddress.email,
    shippingPhone: shippingAddress.phone,
    expressShipping: expressShipping || false,
    customerNotes: customerNotes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  // Insert order lines
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await db.insert(schema.orderLines).values({
      orderId: order.id,
      lineNumber: i + 1,
      masterCode: item.productMasterCode,
      sku: item.variantSku,
      variantId: item.variantId,
      productName: item.productName,
      colorDescription: item.color,
      size: item.size || null,
      quantity: item.quantity,
      unitPriceSell: String(item.unitPriceTotal),
      lineTotal: String(item.totalPrice),
      printConfig: item.customization ? item.customization as any : null,
      proofStatus: item.orderType === "PRINT" ? "in_progress" : "not_applicable",
      artworkUrl: item.customization?.artworkUrl || null,
      mockupUrl: item.customization?.mockupUrl || null,
      createdAt: new Date(),
    });
  }

  return { orderId: order.id, orderNumber, finalShippingCost, totalPrice };
}

// ============================================================
// CREATE STRIPE CHECKOUT SESSION
// ============================================================

export async function createCheckoutSession(params: {
  orderId: number;
  orderNumber: string;
  customerEmail: string;
  totalPrice: number;
  items: CartItem[];
  expressShipping: boolean;
  couponCode?: string;
  finalShippingCost: number;
}): Promise<{ sessionUrl: string; sessionId: string }> {
  const { orderId, orderNumber, customerEmail, totalPrice, items, expressShipping, couponCode, finalShippingCost } = params;

  // ── TAX RATES (IVA 21%) ────────────────────────────────────
  const taxRatesList = await stripe.taxRates.list({ active: true, limit: 100 });
  let ivaRate = taxRatesList.data.find(t => t.percentage === 21 && t.display_name === "IVA");
  if (!ivaRate) {
    ivaRate = await stripe.taxRates.create({
      display_name: "IVA",
      description: "IVA España (21%)",
      jurisdiction: "ES",
      percentage: 21,
      inclusive: false,
    });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
    price_data: {
      currency: "eur",
      product_data: {
        name: item.productName,
        description: `${item.color}${item.customization ? ` — ${item.customization.positions.map(p => p.techniqueName).join(" + ")}` : ""}`,
        images: item.productImage ? [item.productImage] : undefined,
      },
      unit_amount: Math.round(item.unitPriceTotal * 100), // Stripe uses cents
    },
    quantity: item.quantity,
    tax_rates: [ivaRate.id],
  }));

  // ── Payment methods ────────────────────────────────────────
  // "card" includes Apple Pay and Google Pay automatically:
  //   - Apple Pay appears on Safari/iOS when domain is verified
  //   - Google Pay appears on Chrome/Android automatically
  //   - Both use the "card" payment method type in Stripe
  // "sepa_debit" for SEPA bank transfers (common in EU B2B)
  // "link" for Stripe Link (1-click checkout for returning users)
  //
  // To enable Apple Pay:
  //   1. Stripe Dashboard → Settings → Payment Methods → Apple Pay
  //   2. Add & verify domain: universomerchan.com
  //   3. Place verification file at:
  //      /.well-known/apple-developer-merchantid-domain-association
  //      (configured in Nginx, see DEPLOY.md)
  //
  // Google Pay: Enabled automatically, no extra config needed.
  // ────────────────────────────────────────────────────────────

  let stripeCouponId: string | undefined = undefined;

  if (couponCode) {
    const coupon = await db.query.coupons.findFirst({ where: eq(schema.coupons.code, couponCode.toUpperCase().trim()) });
    if (coupon) {
      if (coupon.discountType === "percentage") {
        const stripeCoupon = await stripe.coupons.create({
          percent_off: parseFloat(coupon.discountValue.toString()),
          duration: "once",
          name: `Cupón: ${coupon.code}`,
        });
        stripeCouponId = stripeCoupon.id;
      } else {
        const stripeCoupon = await stripe.coupons.create({
          amount_off: Math.round(parseFloat(coupon.discountValue.toString()) * 100),
          currency: "eur",
          duration: "once",
          name: `Cupón: ${coupon.code}`,
        });
        stripeCouponId = stripeCoupon.id;
      }
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: customerEmail,
    line_items: lineItems,
    metadata: {
      order_id: String(orderId),
      order_number: orderNumber,
    },
    success_url: `${SITE_URL}/checkout/success?order=${orderNumber}`,
    cancel_url: `${SITE_URL}/checkout/cancel?order=${orderNumber}`,
    locale: "es",

    // Card = Visa/MC/Amex + Apple Pay + Google Pay
    // customer_balance = SEPA Bank Transfers
    payment_method_types: ["card", "customer_balance"],
    payment_method_options: {
      customer_balance: {
        funding_type: "bank_transfer",
        bank_transfer: {
          type: "eu_bank_transfer",
        },
      },
    },

    // Auto-generate invoice (useful for B2B clients with CIF)
    invoice_creation: {
      enabled: true,
    },

    // Inject temporary stripe coupon dynamically
    discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : undefined,

    // Allow promo codes if we add them later
    allow_promotion_codes: !stripeCouponId,

    // Collect billing address (needed for invoices)
    billing_address_collection: "required",

    // Phone number for shipping coordination
    phone_number_collection: {
      enabled: true,
    },

    // Shipping options dynamically updated via finalShippingCost
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: Math.round(finalShippingCost * 100), currency: "eur" },
          display_name: expressShipping ? "Envío Directo (Gestión pedidos < 300€)" : "Envío estándar",
          delivery_estimate: expressShipping ? {
            minimum: { unit: "business_day", value: 3 },
            maximum: { unit: "business_day", value: 5 },
          } : {
            minimum: { unit: "business_day", value: 7 },
            maximum: { unit: "business_day", value: 10 },
          },
        },
      },
    ],
  });

  // Update order with Stripe session
  await db.update(schema.orders).set({
    stripeSessionId: session.id,
    status: "pending_payment",
    updatedAt: new Date(),
  }).where(eq(schema.orders.id, orderId));

  return {
    sessionUrl: session.url!,
    sessionId: session.id,
  };
}

// ============================================================
// HANDLE STRIPE WEBHOOK — payment_intent.succeeded
// ============================================================

export async function handlePaymentSuccess(
  paymentIntentId: string,
  sessionId: string,
): Promise<void> {
  // Find order by Stripe session
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.stripeSessionId, sessionId),
  });

  if (!order) {
    console.error(`[Checkout] No order found for session ${sessionId}`);
    return;
  }

  await finalizeOrder(order.id, true, paymentIntentId, sessionId);
}

export async function handlePendingTransfer(
  paymentIntentId: string,
  sessionId: string,
): Promise<void> {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.stripeSessionId, sessionId),
  });

  if (!order) return;

  await finalizeOrder(order.id, false, paymentIntentId, sessionId);
}

export async function processFreeOrder(orderId: number): Promise<void> {
  await finalizeOrder(orderId, true);
}

async function finalizeOrder(orderId: number, isPaid: boolean, stripePaymentIntentId?: string, sessionId?: string) {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order) return;

  // Si la orden ya estaba fully paid (por ej. si Midocean ya empezó), no re-ejecutar.
  if (order.status === "paid" && isPaid) {
    return;
  }

  let invoicePdfUrl: string | undefined;
  if (isPaid && sessionId) {
    try {
      const sessionResponse = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['invoice']
      });
      if (sessionResponse.invoice && (sessionResponse.invoice as Stripe.Invoice).invoice_pdf) {
        invoicePdfUrl = (sessionResponse.invoice as Stripe.Invoice).invoice_pdf as string;
      }
    } catch (err) {
      console.error("[Checkout] Failed to retrieve invoice PDF for session", sessionId, err);
    }
  }

  const newStatus = isPaid ? "paid" : "pending_payment";

  // Update order status
  await db.update(schema.orders).set({
    status: newStatus,
    stripePaymentIntentId: stripePaymentIntentId || order.stripePaymentIntentId,
    paidAt: isPaid ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(schema.orders.id, order.id));

  // If this is just a transition from pending_payment to paid (async_payment_succeeded),
  // we do NOT want to resubmit to Midocean or decrement coupons again. We just update status and stop.
  if (order.status === "pending_payment" && isPaid) {
    console.log(`[Checkout] Order ${order.orderNumber} funds finally received`);
    return;
  }

  // Increment coupon usage if an actual coupon code was stored
  if (order.couponCode) {
    const matchingCoupon = await db.query.coupons.findFirst({ where: eq(schema.coupons.code, order.couponCode) });
    if (matchingCoupon) {
      await db.update(schema.coupons).set({
        usageCount: matchingCoupon.usageCount + 1,
      }).where(eq(schema.coupons.code, order.couponCode));
    }
  }

  console.log(`[Checkout] Order ${order.orderNumber} successfully captured (Paid: ${isPaid})`);

  // Get user and order lines
  const user = await db.query.users.findFirst({ where: eq(schema.users.id, order.userId) });
  const orderLines = await db.query.orderLines.findMany({
    where: eq(schema.orderLines.orderId, order.id),
  });

  // Send confirmation email to customer
  if (user?.email) {
    await emails.sendOrderConfirmationEmail(user.email, {
      firstName: user.firstName || "Cliente",
      orderNumber: order.orderNumber,
      items: orderLines.map(l => ({
        name: l.productName || "",
        quantity: l.quantity,
        color: l.colorDescription || "",
        technique: l.printConfig ? "Con personalización" : undefined,
      })),
      totalPrice: `${parseFloat(order.totalPrice?.toString() || "0").toFixed(2)} €`,
      estimatedDelivery: "7-10 días laborables",
      invoicePdfUrl: invoicePdfUrl,
    });
  }

  // Notify admin
  await emails.notifyAdminNewOrder({
    orderNumber: order.orderNumber,
    clientName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    clientEmail: user?.email || "",
    totalPrice: `${parseFloat(order.totalPrice?.toString() || "0").toFixed(2)} €`,
    items: orderLines.map(l => ({ name: l.productName || "", quantity: l.quantity })),
    hasCustomization: order.orderType === "PRINT",
  });

  // Submit to Midocean
  try {
    await submitOrderToMidocean(order.id);
  } catch (error: any) {
    console.error(`[Checkout] Failed to submit to Midocean: ${error.message}`);
    // Don't fail the payment — log error for admin to handle manually
    await db.insert(schema.errorLog).values({
      errorType: "order_api_error",
      severity: "high",
      message: `Failed to submit order ${order.orderNumber} to Midocean: ${error.message}`,
      orderId: order.id,
      createdAt: new Date(),
    });
    await emails.notifyAdminOrderError({
      orderNumber: order.orderNumber,
      errorType: "Midocean API Error",
      message: error.message,
    });
  }
}

// ============================================================
// SUBMIT ORDER TO MIDOCEAN — Via Order Entry 2.1 API
// ============================================================

export async function submitOrderToMidocean(orderId: number): Promise<void> {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order) throw new Error("Order not found");

  const orderLines = await db.query.orderLines.findMany({
    where: eq(schema.orderLines.orderId, orderId),
  });

  // Build shipping date (preferred: 1 day from now)
  const shippingDate = new Date();
  shippingDate.setDate(shippingDate.getDate() + 1);
  const shippingDateStr = shippingDate.toISOString().split("T")[0];

  // ── GROUPING LOGIC FOR MIDOCEAN ──
  const groupedPrintLines = new Map<string, any>();
  const normalLines: any[] = [];

  for (const line of orderLines) {
    if (order.orderType === "PRINT" && line.printConfig) {
      const config = line.printConfig as any;
      const colorCode = (line.sku || "").replace(`${line.masterCode}-`, "").split("-")[0] || "";
      const hashKey = `${line.masterCode}_${colorCode}_${JSON.stringify(config.positions)}`;

      if (!groupedPrintLines.has(hashKey)) {
        groupedPrintLines.set(hashKey, {
          // Usamos el lineNumber de la PRIMERA línea que entre al grupo como order_line_id de todo el bloque
          order_line_id: String(line.lineNumber * 10),
          master_code: line.masterCode,
          quantity: 0,
          expected_price: "0",
          printing_positions: (config.positions || []).map((pos: any) => ({
            id: pos.positionId,
            print_size_height: String(pos.printHeightMm),
            print_size_width: String(pos.printWidthMm),
            printing_technique_id: pos.techniqueId,
            number_of_print_colors: String(pos.numColors),
            print_artwork_url: config.artworkUrl || "",
            print_mockup_url: config.mockupUrl || "",
            print_instruction: pos.instructions || "None",
            print_colors: (pos.pmsColors || []).map((c: string) => ({ color: c })),
          })),
          print_items: [],
          _refLine: line,
        });
      }

      const group = groupedPrintLines.get(hashKey);
      group.quantity += line.quantity;
      group.print_items.push({
        item_color_number: colorCode,
        ...(line.size ? { item_size: line.size } : {}),
        quantity: String(line.quantity),
      });
    } else {
      normalLines.push({
        order_line_id: String(line.lineNumber * 10),
        sku: line.sku || "",
        variant_id: line.variantId || "",
        quantity: String(line.quantity),
        expected_price: "0",
      });
    }
  }

  // Convert map to array and stringify merged quantities
  const mergedPrintLines = Array.from(groupedPrintLines.values()).map(g => {
    const { _refLine, ...rest } = g;
    return { ...rest, quantity: String(rest.quantity) };
  });

  const midoceanOrder: midoceanApi.MidoceanOrderRequest = {
    order_header: {
      preferred_shipping_date: shippingDateStr,
      currency: "EUR",
      contact_email: order.shippingEmail || "",
      check_price: "false",
      shipping_address: {
        contact_name: order.shippingName || "",
        company_name: order.shippingCompany || "",
        street1: order.shippingStreet || "",
        postal_code: order.shippingPostalCode || "",
        city: order.shippingCity || "",
        region: "",
        country: order.shippingCountry || "ES",
        email: order.shippingEmail || "",
        phone: order.shippingPhone || "",
      },
      po_number: order.orderNumber,
      timestamp: new Date().toISOString(),
      contact_name: order.shippingName || "",
      order_type: order.orderType as "NORMAL" | "PRINT" | "SAMPLE",
      express: order.expressShipping ? "true" : "false",
    },
    order_lines: [...mergedPrintLines, ...normalLines],
  };

  // Submit to Midocean
  const response = await midoceanApi.createOrder(midoceanOrder);

  // Store Midocean's order number
  const midoceanOrderNumber = response?.order_number || response?.order_header?.order_number;

  await db.update(schema.orders).set({
    status: "submitted",
    midoceanOrderNumber: midoceanOrderNumber || null,
    midoceanPoNumber: order.orderNumber,
    updatedAt: new Date(),
  }).where(eq(schema.orders.id, orderId));

  // If it's a PRINT order, upload artworks
  // Iteramos sobre groupedPrintLines para subir el artwork 1 única vez por grupo
  if (order.orderType === "PRINT") {
    for (const group of Array.from(groupedPrintLines.values())) {
      const line = group._refLine;
      if (line.artworkUrl && midoceanOrderNumber) {
        try {
          await midoceanApi.addArtwork(
            midoceanOrderNumber,
            group.order_line_id,
            line.artworkUrl,
          );
        } catch (artworkError: any) {
          console.error(`[Order] Failed to add artwork for line ${line.lineNumber}:`, artworkError.message);
        }
      }
    }
  }

  console.log(`[Order] ${order.orderNumber} submitted to Midocean as ${midoceanOrderNumber}`);
}

// ============================================================
// HANDLE PROOF APPROVAL — From customer's account panel
// ============================================================

export async function handleProofApproval(
  orderId: number,
  lineId: number,
  approved: boolean,
  rejectionReason?: string,
): Promise<void> {
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order || !order.midoceanOrderNumber) {
    throw new Error("Order not found or not yet submitted to Midocean");
  }

  const orderLine = await db.query.orderLines.findFirst({
    where: eq(schema.orderLines.id, lineId),
  });
  if (!orderLine) throw new Error("Order line not found");

  // Si fue un pedido PRINT y se agrupó, buscamos la línea "primaria" del grupo (la de menor lineNumber)
  let midoceanLineId = String(orderLine.lineNumber * 10);

  if (order.orderType === "PRINT" && orderLine.printConfig) {
    const allLines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, orderId),
      orderBy: schema.orderLines.lineNumber,
    });
    const orderLineColor = (orderLine.sku || "").replace(`${orderLine.masterCode}-`, "").split("-")[0] || "";

    // El primer matching define el ID aglutinado en Midocean
    const firstMatchingLine = allLines.find(l => {
      const lColor = (l.sku || "").replace(`${l.masterCode}-`, "").split("-")[0] || "";
      return l.masterCode === orderLine.masterCode &&
        lColor === orderLineColor &&
        JSON.stringify(l.printConfig) === JSON.stringify(orderLine.printConfig);
    });
    if (firstMatchingLine) {
      midoceanLineId = String(firstMatchingLine.lineNumber * 10);
    }
  }

  if (approved) {
    // Approve in Midocean
    await midoceanApi.approveProof(order.midoceanOrderNumber, midoceanLineId);

    // Update local DB
    await db.update(schema.orderLines).set({
      proofStatus: "approved",
      proofApprovedAt: new Date(),
    }).where(eq(schema.orderLines.id, lineId));

    // Check if all lines are approved
    const allLines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, orderId),
    });
    const allApproved = allLines.every(
      l => l.proofStatus === "approved" || l.proofStatus === "not_applicable"
    );

    if (allApproved) {
      await db.update(schema.orders).set({
        status: "proof_approved",
        updatedAt: new Date(),
      }).where(eq(schema.orders.id, orderId));
    }

    // Email customer
    const user = await db.query.users.findFirst({ where: eq(schema.users.id, order.userId) });
    if (user?.email) {
      await emails.sendProofApprovedEmail(user.email, {
        firstName: user.firstName || "Cliente",
        orderNumber: order.orderNumber,
      });
    }

  } else {
    // Reject in Midocean
    await midoceanApi.rejectProof(
      order.midoceanOrderNumber,
      midoceanLineId,
      rejectionReason || "Customer requested changes",
    );

    // Update local DB
    await db.update(schema.orderLines).set({
      proofStatus: "rejected",
      proofRejectedAt: new Date(),
      proofRejectionReason: rejectionReason || null,
    }).where(eq(schema.orderLines.id, lineId));

    await db.update(schema.orders).set({
      status: "proof_rejected",
      updatedAt: new Date(),
    }).where(eq(schema.orders.id, orderId));

    // Notify admin
    await emails.notifyAdminProofRejected({
      orderNumber: order.orderNumber,
      clientName: `${(await db.query.users.findFirst({ where: eq(schema.users.id, order.userId) }))?.firstName || ""}`,
      productName: orderLine.productName || "",
      reason: rejectionReason || "Sin motivo especificado",
    });
  }
}
