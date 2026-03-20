// ============================================================
// UNIVERSO MERCHAN — Customer Account API
// ============================================================
// Server functions for the customer's "Mi cuenta" area:
//   - Order list with filters and status
//   - Order detail with proof approval/rejection
//   - Profile management
//   - Quote history
//   - Reorder from previous orders
// ============================================================

import { db } from "./database";
import { eq, desc, and, sql } from "drizzle-orm";
import * as schema from "./schema";
import { handleProofApproval } from "./cart-checkout";
import {
  sendProofReadyEmail,
  sendProofApprovedEmail,
} from "./email-service";

// ============================================================
// TYPES
// ============================================================

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  status: string;
  statusLabel: string;
  statusColor: string;
  orderType: string;
  totalPrice: number;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  forwarder: string | null;
  expressShipping: boolean;
  itemCount: number;
  hasProofPending: boolean;
  lines: CustomerOrderLine[];
}

export interface CustomerOrderLine {
  id: number;
  lineNumber: number;
  productName: string;
  masterCode: string;
  color: string;
  size: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  productImage: string | null;
  
  // Customization
  hasCustomization: boolean;
  customizationSummary: string | null;
  techniqueNames: string[];
  
  // Proof
  proofStatus: string;
  proofStatusLabel: string;
  proofStatusColor: string;
  proofUrl: string | null;
  proofApprovedAt: string | null;
  proofRejectedAt: string | null;
  proofRejectionReason: string | null;
  
  // Artwork
  artworkUrl: string | null;
  mockupUrl: string | null;
}

export interface CustomerQuote {
  id: number;
  quoteNumber: string;
  totalPrice: number;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
  isConverted: boolean;
  convertedOrderNumber: string | null;
  itemCount: number;
  itemSummary: string;
  buyUrl: string;
  pdfUrl: string;
}

// ============================================================
// STATUS LABELS & COLORS
// ============================================================

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft:            { label: "Borrador",              color: "#9CA3AF" },
  pending_payment:  { label: "Pendiente de pago",     color: "#F59E0B" },
  paid:             { label: "Pagado",                 color: "#3B82F6" },
  submitted:        { label: "Enviado a producción",   color: "#3B82F6" },
  proof_pending:    { label: "Boceto pendiente",       color: "#F59E0B" },
  proof_approved:   { label: "Boceto aprobado",        color: "#22C55E" },
  proof_rejected:   { label: "Boceto rechazado",       color: "#EF4444" },
  in_production:    { label: "En producción",          color: "#8B5CF6" },
  shipped:          { label: "Enviado",                color: "#22C55E" },
  completed:        { label: "Entregado",              color: "#6B7280" },
  cancelled:        { label: "Cancelado",              color: "#EF4444" },
  error:            { label: "Error",                  color: "#EF4444" },
};

const PROOF_STATUS_MAP: Record<string, { label: string; color: string }> = {
  not_applicable:   { label: "Sin marcaje",            color: "#9CA3AF" },
  in_progress:      { label: "Preparando boceto",      color: "#3B82F6" },
  artwork_required: { label: "Artwork requerido",      color: "#F59E0B" },
  waiting_approval: { label: "Pendiente aprobación",   color: "#F59E0B" },
  approved:         { label: "Aprobado",               color: "#22C55E" },
  rejected:         { label: "Rechazado",              color: "#EF4444" },
};

// ============================================================
// GET CUSTOMER ORDERS
// ============================================================

export async function getCustomerOrders(
  userId: number,
  params?: { status?: string; page?: number; limit?: number }
): Promise<{ orders: CustomerOrder[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const conditions = [eq(schema.orders.userId, userId)];
  if (params?.status && params.status !== "all") {
    conditions.push(eq(schema.orders.status, params.status as any));
  }

  // Count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(and(...conditions));
  const total = Number(countResult[0].count);

  // Fetch orders
  const orders = await db.query.orders.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.orders.createdAt)],
    limit,
    offset,
  });

  const enriched: CustomerOrder[] = [];

  for (const order of orders) {
    const lines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, order.id),
      orderBy: [schema.orderLines.lineNumber],
    });

    const hasProofPending = lines.some(
      (l) => l.proofStatus === "waiting_approval"
    );

    const orderStatusInfo = ORDER_STATUS_MAP[order.status] || {
      label: order.status,
      color: "#9CA3AF",
    };

    const enrichedLines: CustomerOrderLine[] = await Promise.all(
      lines.map(async (line) => {
        // Get product image
        let productImage: string | null = null;
        if (line.sku) {
          const variant = await db.query.productVariants.findFirst({
            where: eq(schema.productVariants.sku, line.sku),
          });
          if (variant?.digitalAssets) {
            const assets = variant.digitalAssets as any[];
            const front = assets.find((a: any) => a.subtype === "item_picture_front");
            productImage = front?.url || null;
          }
        }

        // Parse customization
        const config = line.printConfig as any;
        let customizationSummary: string | null = null;
        let techniqueNames: string[] = [];

        if (config?.positions?.length) {
          techniqueNames = config.positions.map(
            (p: any) => p.techniqueName || p.techniqueId
          );
          customizationSummary = config.positions
            .map(
              (p: any) =>
                `${p.positionName}: ${p.techniqueName || p.techniqueId}${
                  p.numColors ? ` (${p.numColors} col.)` : ""
                }`
            )
            .join(" + ");
        }

        const proofInfo = PROOF_STATUS_MAP[line.proofStatus || "not_applicable"] || {
          label: line.proofStatus,
          color: "#9CA3AF",
        };

        return {
          id: line.id,
          lineNumber: line.lineNumber,
          productName: line.productName || "",
          masterCode: line.masterCode,
          color: line.colorDescription || "",
          size: line.size,
          quantity: line.quantity,
          unitPrice: parseFloat(line.unitPriceSell?.toString() || "0"),
          lineTotal: parseFloat(line.lineTotal?.toString() || "0"),
          productImage,
          hasCustomization: !!config?.positions?.length,
          customizationSummary,
          techniqueNames,
          proofStatus: line.proofStatus || "not_applicable",
          proofStatusLabel: proofInfo.label,
          proofStatusColor: proofInfo.color,
          proofUrl: line.proofUrl,
          proofApprovedAt: line.proofApprovedAt?.toISOString() || null,
          proofRejectedAt: line.proofRejectedAt?.toISOString() || null,
          proofRejectionReason: line.proofRejectionReason,
          artworkUrl: line.artworkUrl,
          mockupUrl: line.mockupUrl,
        };
      })
    );

    enriched.push({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      statusLabel: orderStatusInfo.label,
      statusColor: orderStatusInfo.color,
      orderType: order.orderType,
      totalPrice: parseFloat(order.totalPrice?.toString() || "0"),
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      forwarder: order.forwarder,
      expressShipping: order.expressShipping || false,
      itemCount: lines.length,
      hasProofPending,
      lines: enrichedLines,
    });
  }

  return { orders: enriched, total };
}

// ============================================================
// GET SINGLE ORDER DETAIL
// ============================================================

export async function getCustomerOrderDetail(
  userId: number,
  orderNumber: string
): Promise<CustomerOrder | null> {
  const result = await getCustomerOrders(userId, { limit: 1 });
  // Need to fetch specifically by orderNumber
  const order = await db.query.orders.findFirst({
    where: and(
      eq(schema.orders.userId, userId),
      eq(schema.orders.orderNumber, orderNumber)
    ),
  });

  if (!order) return null;

  const fullResult = await getCustomerOrders(userId, { limit: 100 });
  return fullResult.orders.find((o) => o.orderNumber === orderNumber) || null;
}

// ============================================================
// PROOF ACTIONS — Approve or reject from customer panel
// ============================================================

export async function customerApproveProof(
  userId: number,
  orderId: number,
  lineId: number
): Promise<{ success: boolean; message: string }> {
  // Verify ownership
  const order = await db.query.orders.findFirst({
    where: and(
      eq(schema.orders.id, orderId),
      eq(schema.orders.userId, userId)
    ),
  });

  if (!order) {
    return { success: false, message: "Pedido no encontrado" };
  }

  // Verify line belongs to this order and has pending proof
  const line = await db.query.orderLines.findFirst({
    where: and(
      eq(schema.orderLines.id, lineId),
      eq(schema.orderLines.orderId, orderId)
    ),
  });

  if (!line) {
    return { success: false, message: "Línea de pedido no encontrada" };
  }

  if (line.proofStatus !== "waiting_approval") {
    return {
      success: false,
      message: `No se puede aprobar: estado actual es "${
        PROOF_STATUS_MAP[line.proofStatus || ""]?.label || line.proofStatus
      }"`,
    };
  }

  try {
    await handleProofApproval(orderId, lineId, true);
    return {
      success: true,
      message: "Boceto aprobado correctamente. Tu pedido entra en producción.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error al aprobar: ${error.message}`,
    };
  }
}

export async function customerRejectProof(
  userId: number,
  orderId: number,
  lineId: number,
  reason: string
): Promise<{ success: boolean; message: string }> {
  // Verify ownership
  const order = await db.query.orders.findFirst({
    where: and(
      eq(schema.orders.id, orderId),
      eq(schema.orders.userId, userId)
    ),
  });

  if (!order) {
    return { success: false, message: "Pedido no encontrado" };
  }

  const line = await db.query.orderLines.findFirst({
    where: and(
      eq(schema.orderLines.id, lineId),
      eq(schema.orderLines.orderId, orderId)
    ),
  });

  if (!line) {
    return { success: false, message: "Línea de pedido no encontrada" };
  }

  if (line.proofStatus !== "waiting_approval") {
    return {
      success: false,
      message: `No se puede rechazar: estado actual es "${
        PROOF_STATUS_MAP[line.proofStatus || ""]?.label || line.proofStatus
      }"`,
    };
  }

  if (!reason || reason.trim().length < 5) {
    return {
      success: false,
      message: "Por favor, indica el motivo del rechazo (mínimo 5 caracteres)",
    };
  }

  try {
    await handleProofApproval(orderId, lineId, false, reason.trim());
    return {
      success: true,
      message:
        "Boceto rechazado. Midocean preparará una nueva versión y te avisaremos cuando esté lista.",
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Error al rechazar: ${error.message}`,
    };
  }
}

// ============================================================
// GET CUSTOMER QUOTES
// ============================================================

export async function getCustomerQuotes(
  userId: number
): Promise<CustomerQuote[]> {
  const quotes = await db.query.quotes.findMany({
    where: eq(schema.quotes.userId, userId),
    orderBy: [desc(schema.quotes.createdAt)],
  });

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

  return quotes.map((q) => {
    const items = (q.cartSnapshot as any[]) || [];
    const isExpired = q.expiresAt ? new Date() > new Date(q.expiresAt) : false;

    let convertedOrderNumber: string | null = null;
    // Would need a join to get this — simplified for now

    const itemSummary = items
      .slice(0, 3)
      .map((i: any) => i.productName || "Producto")
      .join(", ");

    return {
      id: q.id,
      quoteNumber: q.quoteNumber,
      totalPrice: parseFloat(q.totalPrice?.toString() || "0"),
      createdAt: q.createdAt.toISOString(),
      expiresAt: q.expiresAt?.toISOString() || null,
      isExpired,
      isConverted: !!q.convertedToOrderId,
      convertedOrderNumber,
      itemCount: items.length,
      itemSummary:
        items.length > 3
          ? `${itemSummary} y ${items.length - 3} más`
          : itemSummary,
      buyUrl: `${SITE_URL}/cart/restore?quote=${q.quoteNumber}`,
      pdfUrl: `${SITE_URL}/api/quotes/${q.quoteNumber}/pdf`,
    };
  });
}

// ============================================================
// REORDER — Copy items from a previous order to cart
// ============================================================

export async function getReorderItems(
  userId: number,
  orderId: number
): Promise<{ success: boolean; items?: any[]; error?: string }> {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(schema.orders.id, orderId),
      eq(schema.orders.userId, userId)
    ),
  });

  if (!order) {
    return { success: false, error: "Pedido no encontrado" };
  }

  const lines = await db.query.orderLines.findMany({
    where: eq(schema.orderLines.orderId, orderId),
  });

  // Rebuild cart items from order lines
  const items = await Promise.all(
    lines.map(async (line) => {
      // Get current stock
      const stockEntry = await db.query.stock.findFirst({
        where: eq(schema.stock.sku, line.sku || ""),
      });

      // Get current price
      const priceEntry = await db.query.productPrices.findFirst({
        where: eq(schema.productPrices.masterCode, line.masterCode),
      });

      // Get product image
      let productImage = "";
      if (line.sku) {
        const variant = await db.query.productVariants.findFirst({
          where: eq(schema.productVariants.sku, line.sku),
        });
        if (variant?.digitalAssets) {
          const assets = variant.digitalAssets as any[];
          const front = assets.find(
            (a: any) => a.subtype === "item_picture_front"
          );
          productImage = front?.url || "";
        }
      }

      return {
        productMasterCode: line.masterCode,
        productName: line.productName,
        variantSku: line.sku,
        variantId: line.variantId,
        color: line.colorDescription,
        size: line.size,
        quantity: line.quantity,
        currentStock: stockEntry?.quantity || 0,
        inStock: (stockEntry?.quantity || 0) >= line.quantity,
        productImage,
        // Note: prices may have changed — customer should review
        previousUnitPrice: parseFloat(line.unitPriceSell?.toString() || "0"),
        customization: line.printConfig || null,
        orderType: line.printConfig ? "PRINT" : "NORMAL",
      };
    })
  );

  return { success: true, items };
}

// ============================================================
// ORDER TIMELINE — Activity log for a specific order
// ============================================================

export interface OrderTimelineEvent {
  timestamp: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
  icon: string;
}

export function buildOrderTimeline(order: CustomerOrder): OrderTimelineEvent[] {
  const events: OrderTimelineEvent[] = [];

  // Order created
  events.push({
    timestamp: order.createdAt,
    title: "Pedido creado",
    description: `Pedido ${order.orderNumber} creado`,
    type: "info",
    icon: "cart",
  });

  // Payment
  if (order.paidAt) {
    events.push({
      timestamp: order.paidAt,
      title: "Pago confirmado",
      description: `Pago de ${order.totalPrice.toFixed(2)} € confirmado`,
      type: "success",
      icon: "check",
    });
  }

  // Proof events
  for (const line of order.lines) {
    if (line.proofStatus === "waiting_approval" && line.proofUrl) {
      events.push({
        timestamp: new Date().toISOString(), // Approximate
        title: "Boceto listo",
        description: `El boceto de "${line.productName}" está listo para revisar`,
        type: "warning",
        icon: "eye",
      });
    }

    if (line.proofApprovedAt) {
      events.push({
        timestamp: line.proofApprovedAt,
        title: "Boceto aprobado",
        description: `Aprobaste el boceto de "${line.productName}"`,
        type: "success",
        icon: "check",
      });
    }

    if (line.proofRejectedAt) {
      events.push({
        timestamp: line.proofRejectedAt,
        title: "Boceto rechazado",
        description: `Rechazaste el boceto: ${line.proofRejectionReason || "sin motivo"}`,
        type: "error",
        icon: "x",
      });
    }
  }

  // Shipping
  if (order.shippedAt) {
    events.push({
      timestamp: order.shippedAt,
      title: "Pedido enviado",
      description: `Enviado con ${order.forwarder || "transportista"}. Tracking: ${order.trackingNumber || "pendiente"}`,
      type: "success",
      icon: "truck",
    });
  }

  // Completed
  if (order.status === "completed") {
    events.push({
      timestamp: order.shippedAt || order.createdAt,
      title: "Pedido entregado",
      description: "Tu pedido ha sido entregado correctamente",
      type: "success",
      icon: "check",
    });
  }

  // Sort by timestamp (newest first)
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return events;
}

// ============================================================
// CUSTOMER STATS — For the account overview
// ============================================================

export async function getCustomerStats(userId: number): Promise<{
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  proofsToReview: number;
  activeQuotes: number;
}> {
  // Total orders (excluding drafts)
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.userId, userId),
        sql`${schema.orders.status} != 'draft'`
      )
    );

  // Total spent
  const spentResult = await db
    .select({ total: sql<number>`COALESCE(SUM(CAST(total_price AS DECIMAL)), 0)` })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.userId, userId),
        sql`${schema.orders.status} NOT IN ('draft', 'cancelled', 'error')`
      )
    );

  // Pending orders
  const pendingResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(
      and(
        eq(schema.orders.userId, userId),
        sql`${schema.orders.status} IN ('paid', 'submitted', 'proof_pending', 'proof_approved', 'in_production', 'shipped')`
      )
    );

  // Proofs to review
  const proofsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orderLines)
    .innerJoin(schema.orders, eq(schema.orderLines.orderId, schema.orders.id))
    .where(
      and(
        eq(schema.orders.userId, userId),
        eq(schema.orderLines.proofStatus, "waiting_approval")
      )
    );

  // Active quotes
  const quotesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.quotes)
    .where(
      and(
        eq(schema.quotes.userId, userId),
        sql`${schema.quotes.expiresAt} > NOW()`,
        sql`${schema.quotes.convertedToOrderId} IS NULL`
      )
    );

  return {
    totalOrders: Number(totalResult[0].count),
    totalSpent: Number(spentResult[0].total),
    pendingOrders: Number(pendingResult[0].count),
    proofsToReview: Number(proofsResult[0].count),
    activeQuotes: Number(quotesResult[0].count),
  };
}
