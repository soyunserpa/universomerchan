// ============================================================
// UNIVERSO MERCHAN — Admin Dashboard API
// ============================================================
// Backend for admin.universomerchan.com
// Completely separate from customer-facing APIs.
//
// All endpoints require admin role JWT authentication.
//
// Sections:
//   1. KPIs & Analytics
//   2. Order Management
//   3. Product Management (visibility, custom prices)
//   4. Client Management (discounts, overview)
//   5. Margin & Settings Controls
//   6. Sync Status & Error Log
// ============================================================

import { db } from "./database";
import { eq, desc, asc, and, sql, ilike, or, gte, lte, count } from "drizzle-orm";
import * as schema from "./schema";

// ============================================================
// 1. KPIs & ANALYTICS
// ============================================================

export interface DashboardKPIs {
  // Revenue
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChangePercent: number;

  // Orders
  ordersThisMonth: number;
  ordersLastMonth: number;
  ordersChangePercent: number;

  // Average ticket
  avgTicketThisMonth: number;
  avgTicketLastMonth: number;
  avgTicketChangePercent: number;

  // Conversion (orders / registered users this month)
  conversionRate: number;
  conversionChangePercent: number;

  // Active counts
  activeOrders: number;       // Not completed/cancelled
  proofsAwaitingApproval: number;
  pendingErrors: number;      // Unresolved errors
  lowStockAlerts: number;

  // Users
  totalCustomers: number;
  newCustomersThisMonth: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Revenue this month
  const revThisMonth = await db
    .select({ total: sql<number>`COALESCE(SUM(CAST(total_price AS DECIMAL)), 0)` })
    .from(schema.orders)
    .where(and(
      gte(schema.orders.paidAt, startOfMonth),
      sql`${schema.orders.status} NOT IN ('draft', 'cancelled', 'error')`
    ));

  // Revenue last month
  const revLastMonth = await db
    .select({ total: sql<number>`COALESCE(SUM(CAST(total_price AS DECIMAL)), 0)` })
    .from(schema.orders)
    .where(and(
      gte(schema.orders.paidAt, startOfLastMonth),
      lte(schema.orders.paidAt, endOfLastMonth),
      sql`${schema.orders.status} NOT IN ('draft', 'cancelled', 'error')`
    ));

  const revenueThisMonth = Number(revThisMonth[0].total);
  const revenueLastMonth = Number(revLastMonth[0].total);

  // Orders this month
  const ordThisMonth = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(and(
      gte(schema.orders.paidAt, startOfMonth),
      sql`${schema.orders.status} NOT IN ('draft', 'cancelled')`
    ));

  const ordLastMonth = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(and(
      gte(schema.orders.paidAt, startOfLastMonth),
      lte(schema.orders.paidAt, endOfLastMonth),
      sql`${schema.orders.status} NOT IN ('draft', 'cancelled')`
    ));

  const ordersThisMonth = Number(ordThisMonth[0].count);
  const ordersLastMonth = Number(ordLastMonth[0].count);

  // Avg ticket
  const avgTicketThisMonth = ordersThisMonth > 0 ? revenueThisMonth / ordersThisMonth : 0;
  const avgTicketLastMonth = ordersLastMonth > 0 ? revenueLastMonth / ordersLastMonth : 0;

  // Active orders
  const activeResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(sql`${schema.orders.status} IN ('paid', 'submitted', 'proof_pending', 'proof_approved', 'in_production', 'shipped')`);

  // Proofs awaiting
  const proofsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orderLines)
    .where(eq(schema.orderLines.proofStatus, "waiting_approval"));

  // Pending errors
  const errorsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.errorLog)
    .where(eq(schema.errorLog.resolved, false));

  // Low stock alerts (today)
  const lowStockResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.errorLog)
    .where(and(
      eq(schema.errorLog.errorType, "low_stock"),
      eq(schema.errorLog.resolved, false),
      gte(schema.errorLog.createdAt, new Date(now.getTime() - 24 * 60 * 60 * 1000))
    ));

  // Total customers
  const customersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(eq(schema.users.role, "customer"));

  const newCustomersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(
      eq(schema.users.role, "customer"),
      gte(schema.users.createdAt, startOfMonth)
    ));

  // Conversion rate approximation
  const totalCustomers = Number(customersResult[0].count);
  const conversionRate = totalCustomers > 0 ? (ordersThisMonth / totalCustomers) * 100 : 0;

  const pctChange = (curr: number, prev: number) =>
    prev > 0 ? Math.round(((curr - prev) / prev) * 100) : curr > 0 ? 100 : 0;

  return {
    revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
    revenueLastMonth: Math.round(revenueLastMonth * 100) / 100,
    revenueChangePercent: pctChange(revenueThisMonth, revenueLastMonth),
    ordersThisMonth,
    ordersLastMonth,
    ordersChangePercent: pctChange(ordersThisMonth, ordersLastMonth),
    avgTicketThisMonth: Math.round(avgTicketThisMonth * 100) / 100,
    avgTicketLastMonth: Math.round(avgTicketLastMonth * 100) / 100,
    avgTicketChangePercent: pctChange(avgTicketThisMonth, avgTicketLastMonth),
    conversionRate: Math.round(conversionRate * 10) / 10,
    conversionChangePercent: 0,
    activeOrders: Number(activeResult[0].count),
    proofsAwaitingApproval: Number(proofsResult[0].count),
    pendingErrors: Number(errorsResult[0].count),
    lowStockAlerts: Number(lowStockResult[0].count),
    totalCustomers,
    newCustomersThisMonth: Number(newCustomersResult[0].count),
  };
}

// ============================================================
// REVENUE CHART — Monthly revenue for the last 6 months
// ============================================================

export interface RevenueDataPoint {
  month: string;
  monthLabel: string;
  revenue: number;
  orders: number;
  avgTicket: number;
}

export async function getRevenueChart(months: number = 6): Promise<RevenueDataPoint[]> {
  const data: RevenueDataPoint[] = [];
  const now = new Date();
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    const result = await db
      .select({
        revenue: sql<number>`COALESCE(SUM(CAST(total_price AS DECIMAL)), 0)`,
        orders: sql<number>`count(*)`,
      })
      .from(schema.orders)
      .where(and(
        gte(schema.orders.paidAt, start),
        lte(schema.orders.paidAt, end),
        sql`${schema.orders.status} NOT IN ('draft', 'cancelled', 'error')`
      ));

    const revenue = Number(result[0].revenue);
    const orders = Number(result[0].orders);

    data.push({
      month: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
      monthLabel: monthNames[start.getMonth()],
      revenue: Math.round(revenue * 100) / 100,
      orders,
      avgTicket: orders > 0 ? Math.round((revenue / orders) * 100) / 100 : 0,
    });
  }

  return data;
}

// ============================================================
// TOP PRODUCTS — Best selling products by revenue
// ============================================================

export interface TopProduct {
  masterCode: string;
  productName: string;
  category: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  percentOfTotal: number;
}

export async function getTopProducts(limit: number = 10): Promise<TopProduct[]> {
  const result = await db.execute(sql`
    SELECT 
      ol.master_code,
      ol.product_name,
      p.category_level1 as category,
      SUM(ol.quantity) as total_quantity,
      SUM(CAST(ol.line_total AS DECIMAL)) as total_revenue,
      COUNT(DISTINCT ol.order_id) as order_count
    FROM order_lines ol
    JOIN orders o ON o.id = ol.order_id
    LEFT JOIN products p ON p.master_code = ol.master_code
    WHERE o.status NOT IN ('draft', 'cancelled', 'error')
    GROUP BY ol.master_code, ol.product_name, p.category_level1
    ORDER BY total_revenue DESC
    LIMIT ${limit}
  `);

  const rows = (result as any).rows || (Array.isArray(result) ? result : []) as any[];
  const totalRevenue = rows.reduce((s, r) => s + Number(r.total_revenue || 0), 0);

  return rows.map((r) => ({
    masterCode: r.master_code,
    productName: r.product_name || r.master_code,
    category: r.category || "",
    totalQuantity: Number(r.total_quantity),
    totalRevenue: Math.round(Number(r.total_revenue) * 100) / 100,
    orderCount: Number(r.order_count),
    percentOfTotal: totalRevenue > 0 ? Math.round((Number(r.total_revenue) / totalRevenue) * 1000) / 10 : 0,
  }));
}

// ============================================================
// TOP TECHNIQUES — Most used print techniques
// ============================================================

export interface TopTechnique {
  techniqueName: string;
  useCount: number;
  percentOfTotal: number;
}

export async function getTopTechniques(): Promise<TopTechnique[]> {
  // Parse from order_lines.print_config JSON
  const allLines = await db.query.orderLines.findMany({
    where: sql`${schema.orderLines.printConfig} IS NOT NULL`,
  });

  const techniqueCounts: Record<string, number> = {};
  let total = 0;

  for (const line of allLines) {
    const config = line.printConfig as any;
    if (config?.positions) {
      for (const pos of config.positions) {
        const name = pos.techniqueName || pos.techniqueId || "Desconocida";
        techniqueCounts[name] = (techniqueCounts[name] || 0) + 1;
        total++;
      }
    }
  }

  return Object.entries(techniqueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({
      techniqueName: name,
      useCount: count,
      percentOfTotal: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }));
}

// ============================================================
// 2. ORDER MANAGEMENT
// ============================================================

export interface AdminOrder {
  id: number;
  orderNumber: string;
  midoceanOrderNumber: string | null;
  status: string;
  statusLabel: string;
  statusColor: string;
  orderType: string;

  // Client
  clientName: string;
  clientEmail: string;
  clientCompany: string | null;
  clientId: number;

  // Pricing
  subtotalProduct: number;
  subtotalPrint: number;
  marginProductApplied: number;
  marginPrintApplied: number;
  discountApplied: number;
  shippingCost: number;
  totalPrice: number;

  // Our profit
  totalCostMidocean: number;  // Calculated
  profit: number;
  profitMarginPct: number;

  // Dates
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;

  // Shipping
  trackingNumber: string | null;
  trackingUrl: string | null;
  forwarder: string | null;
  expressShipping: boolean;
  shippingAddress: string;

  // Lines count
  lineCount: number;
  hasCustomization: boolean;
  proofsPending: number;
  customizations: { artworkUrl: string; mockupUrl: string }[];

  // Errors
  lastError: string | null;
  errorCount: number;

  // Notes
  customerNotes: string | null;
  adminNotes: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "Borrador", color: "#9CA3AF" },
  pending_payment: { label: "Pendiente pago", color: "#F59E0B" },
  paid: { label: "Pagado", color: "#3B82F6" },
  submitted: { label: "En Midocean", color: "#3B82F6" },
  proof_pending: { label: "Proof pendiente", color: "#F59E0B" },
  proof_approved: { label: "Proof aprobado", color: "#22C55E" },
  proof_rejected: { label: "Proof rechazado", color: "#EF4444" },
  in_production: { label: "En producción", color: "#8B5CF6" },
  shipped: { label: "Enviado", color: "#22C55E" },
  completed: { label: "Completado", color: "#6B7280" },
  cancelled: { label: "Cancelado", color: "#EF4444" },
  error: { label: "Error", color: "#EF4444" },
};

export async function getAdminOrders(params?: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}): Promise<{ orders: AdminOrder[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 25;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (params?.status && params.status !== "all") {
    conditions.push(eq(schema.orders.status, params.status as any));
  }

  if (params?.search) {
    const search = params.search;
    conditions.push(
      or(
        ilike(schema.orders.orderNumber, `%${search}%`),
        ilike(schema.orders.midoceanOrderNumber, `%${search}%`),
        ilike(schema.orders.shippingName, `%${search}%`),
        ilike(schema.orders.shippingCompany, `%${search}%`),
        ilike(schema.orders.shippingEmail, `%${search}%`),
      )!
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.orders)
    .where(whereClause);
  const total = Number(countResult[0].count);

  // Fetch
  const orders = await db.query.orders.findMany({
    where: whereClause,
    orderBy: [desc(schema.orders.createdAt)],
    limit,
    offset,
  });

  const enriched: AdminOrder[] = [];

  for (const order of orders) {
    // Get client info
    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, order.userId),
    });

    // Get line info
    const lines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, order.id),
    });

    const proofsPending = lines.filter(l => l.proofStatus === "waiting_approval").length;
    const hasCustomization = order.orderType === "PRINT";

    const customizations: { artworkUrl: string; mockupUrl: string }[] = [];
    if (hasCustomization) {
      for (const l of lines) {
        if (l.artworkUrl || l.mockupUrl) {
          customizations.push({
            artworkUrl: l.artworkUrl || "",
            mockupUrl: l.mockupUrl || ""
          });
        }
      }
    }

    // Estimate Midocean cost (product cost = sell / (1 + margin))
    const marginProd = parseFloat(order.marginProductApplied?.toString() || "40");
    const marginPrint = parseFloat(order.marginPrintApplied?.toString() || "50");
    const subtotalProduct = parseFloat(order.subtotalProduct?.toString() || "0");
    const subtotalPrint = parseFloat(order.subtotalPrint?.toString() || "0");
    const totalPrice = parseFloat(order.totalPrice?.toString() || "0");

    const costProduct = subtotalProduct / (1 + marginProd / 100);
    const costPrint = subtotalPrint / (1 + marginPrint / 100);
    const totalCost = costProduct + costPrint;
    const profit = totalPrice - totalCost;

    const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "#9CA3AF" };

    const shippingAddress = [
      order.shippingName,
      order.shippingCompany,
      order.shippingStreet,
      [order.shippingPostalCode, order.shippingCity].filter(Boolean).join(" "),
      order.shippingCountry,
    ].filter(Boolean).join(", ");

    enriched.push({
      id: order.id,
      orderNumber: order.orderNumber,
      midoceanOrderNumber: order.midoceanOrderNumber,
      status: order.status,
      statusLabel: statusInfo.label,
      statusColor: statusInfo.color,
      orderType: order.orderType,
      clientName: `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "—",
      clientEmail: user?.email || order.shippingEmail || "—",
      clientCompany: user?.companyName || order.shippingCompany,
      clientId: order.userId,
      subtotalProduct: Math.round(subtotalProduct * 100) / 100,
      subtotalPrint: Math.round(subtotalPrint * 100) / 100,
      marginProductApplied: marginProd,
      marginPrintApplied: marginPrint,
      discountApplied: parseFloat(order.discountApplied?.toString() || "0"),
      shippingCost: parseFloat(order.shippingCost?.toString() || "0"),
      totalPrice: Math.round(totalPrice * 100) / 100,
      totalCostMidocean: Math.round(totalCost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      profitMarginPct: totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0,
      createdAt: order.createdAt.toISOString(),
      paidAt: order.paidAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      forwarder: order.forwarder,
      expressShipping: order.expressShipping || false,
      shippingAddress,
      lineCount: lines.length,
      hasCustomization,
      customizations,
      proofsPending,
      lastError: order.lastError,
      errorCount: order.errorCount || 0,
      customerNotes: order.customerNotes,
      adminNotes: order.adminNotes,
    });
  }

  return { orders: enriched, total };
}

// Update admin notes on an order
export async function updateOrderAdminNotes(
  orderId: number,
  notes: string
): Promise<void> {
  await db.update(schema.orders).set({
    adminNotes: notes,
    updatedAt: new Date(),
  }).where(eq(schema.orders.id, orderId));
}

// ============================================================
// 3. PRODUCT MANAGEMENT
// ============================================================

export interface AdminProduct {
  id: number;
  masterCode: string;
  name: string;
  category: string;
  material: string;
  isVisible: boolean;
  isGreen: boolean;
  printable: boolean;
  customPrice: number | null;
  midoceanPrice: number;     // Original price from Midocean
  sellPrice: number;          // With current margin applied
  totalStock: number;
  variantCount: number;
  printPositionCount: number;
  lastSynced: string | null;
}

export async function getAdminProducts(params?: {
  search?: string;
  category?: string;
  visibleOnly?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ products: AdminProduct[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 50;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (params?.search) {
    conditions.push(or(
      ilike(schema.products.productName, `%${params.search}%`),
      ilike(schema.products.masterCode, `%${params.search}%`),
    )!);
  }

  if (params?.category) {
    conditions.push(eq(schema.products.categoryLevel1, params.category));
  }

  if (params?.visibleOnly) {
    conditions.push(eq(schema.products.isVisible, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.products)
    .where(whereClause);
  const total = Number(countResult[0].count);

  const products = await db.query.products.findMany({
    where: whereClause,
    orderBy: [asc(schema.products.productName)],
    limit,
    offset,
  });

  // Get margin setting
  const marginSetting = await db.query.adminSettings.findFirst({
    where: eq(schema.adminSettings.key, "margin_product_pct"),
  });
  const marginPct = parseFloat(marginSetting?.value || "40");

  const enriched: AdminProduct[] = [];

  for (const product of products) {
    // Variant count and stock
    const variants = await db.query.productVariants.findMany({
      where: eq(schema.productVariants.productId, product.id),
    });

    let totalStock = 0;
    for (const v of variants) {
      const s = await db.query.stock.findFirst({ where: eq(schema.stock.sku, v.sku) });
      totalStock += s?.quantity || 0;
    }

    // Price
    const priceEntry = await db.query.productPrices.findFirst({
      where: eq(schema.productPrices.masterCode, product.masterCode),
    });
    const scales = (priceEntry?.priceScales as any[]) || [];
    const midoceanPrice = scales.length > 0
      ? parseFloat(scales[0].price?.replace(",", ".") || "0")
      : 0;

    const customPrice = product.customPrice ? parseFloat(product.customPrice.toString()) : null;
    const sellPrice = customPrice || midoceanPrice * (1 + marginPct / 100);

    enriched.push({
      id: product.id,
      masterCode: product.masterCode,
      name: product.productName,
      category: product.categoryLevel1 || "",
      material: product.material || "",
      isVisible: product.isVisible || false,
      isGreen: product.isGreen || false,
      printable: product.printable || false,
      customPrice,
      midoceanPrice: Math.round(midoceanPrice * 100) / 100,
      sellPrice: Math.round(sellPrice * 100) / 100,
      totalStock,
      variantCount: variants.length,
      printPositionCount: product.numberOfPrintPositions || 0,
      lastSynced: product.lastSyncedAt?.toISOString() || null,
    });
  }

  return { products: enriched, total };
}

// Toggle product visibility
export async function toggleProductVisibility(productId: number, visible: boolean): Promise<void> {
  await db.update(schema.products).set({
    isVisible: visible,
    updatedAt: new Date(),
  }).where(eq(schema.products.id, productId));
}

// Set custom price for a product (overrides margin calculation)
export async function setProductCustomPrice(
  productId: number,
  customPrice: number | null
): Promise<void> {
  await db.update(schema.products).set({
    customPrice: customPrice ? String(customPrice) : null,
    updatedAt: new Date(),
  }).where(eq(schema.products.id, productId));
}

// ============================================================
// 4. CLIENT MANAGEMENT
// ============================================================

export interface AdminClient {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string | null;
  cif: string | null;
  phone: string | null;
  discountPercent: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string | null;
  createdAt: string;
  isActive: boolean;
}

export async function getAdminClients(params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<{ clients: AdminClient[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 25;
  const offset = (page - 1) * limit;

  const conditions = [eq(schema.users.role, "customer")];

  if (params?.search) {
    conditions.push(or(
      ilike(schema.users.email, `%${params.search}%`),
      ilike(schema.users.firstName, `%${params.search}%`),
      ilike(schema.users.lastName, `%${params.search}%`),
      ilike(schema.users.companyName, `%${params.search}%`),
    )!);
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.users)
    .where(and(...conditions));
  const total = Number(countResult[0].count);

  const users = await db.query.users.findMany({
    where: and(...conditions),
    orderBy: [desc(schema.users.createdAt)],
    limit,
    offset,
  });

  const enriched: AdminClient[] = [];

  for (const user of users) {
    const orderStats = await db
      .select({
        count: sql<number>`count(*)`,
        total: sql<number>`COALESCE(SUM(CAST(total_price AS DECIMAL)), 0)`,
        lastOrder: sql<string>`MAX(created_at)`,
      })
      .from(schema.orders)
      .where(and(
        eq(schema.orders.userId, user.id),
        sql`${schema.orders.status} NOT IN ('draft', 'cancelled', 'error')`
      ));

    enriched.push({
      id: user.id,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      companyName: user.companyName,
      cif: user.cif,
      phone: user.phone,
      discountPercent: parseFloat(user.discountPercent?.toString() || "0"),
      totalOrders: Number(orderStats[0].count),
      totalSpent: Math.round(Number(orderStats[0].total) * 100) / 100,
      lastOrderDate: orderStats[0].lastOrder || null,
      createdAt: user.createdAt.toISOString(),
      isActive: user.isActive || false,
    });
  }

  return { clients: enriched, total };
}

// Set client discount
export async function setClientDiscount(
  clientId: number,
  discountPercent: number
): Promise<void> {
  await db.update(schema.users).set({
    discountPercent: String(Math.max(0, Math.min(100, discountPercent))),
    updatedAt: new Date(),
  }).where(eq(schema.users.id, clientId));
}

// Toggle client active status
export async function toggleClientActive(
  clientId: number,
  active: boolean
): Promise<void> {
  await db.update(schema.users).set({
    isActive: active,
    updatedAt: new Date(),
  }).where(eq(schema.users.id, clientId));
}

// ============================================================
// 5. MARGIN & SETTINGS
// ============================================================

export interface AdminSettings {
  marginProductPct: number;
  marginPrintPct: number;
  adminEmail: string;
  syncProductsIntervalHours: number;
  syncStockIntervalMinutes: number;
  lowStockThreshold: number;
  quoteValidityDays: number;
  cartAbandonedHours: number;
}

export async function getAdminSettings(): Promise<AdminSettings> {
  const settings = await db.query.adminSettings.findMany();
  const map: Record<string, string> = {};
  for (const s of settings) {
    map[s.key] = s.value;
  }

  return {
    marginProductPct: parseFloat(map.margin_product_pct || "40"),
    marginPrintPct: parseFloat(map.margin_print_pct || "50"),
    adminEmail: map.admin_email || "pedidos@universomerchan.com",
    syncProductsIntervalHours: parseInt(map.sync_products_interval_hours || "6"),
    syncStockIntervalMinutes: parseInt(map.sync_stock_interval_minutes || "30"),
    lowStockThreshold: parseInt(map.low_stock_threshold || "100"),
    quoteValidityDays: parseInt(map.quote_validity_days || "15"),
    cartAbandonedHours: parseInt(map.cart_abandoned_hours || "24"),
  };
}

export async function updateAdminSetting(key: string, value: string): Promise<void> {
  await db.update(schema.adminSettings).set({
    value,
    updatedAt: new Date(),
  }).where(eq(schema.adminSettings.key, key));
}

export async function updateMargins(
  productMarginPct: number,
  printMarginPct: number
): Promise<void> {
  await updateAdminSetting("margin_product_pct", String(productMarginPct));
  await updateAdminSetting("margin_print_pct", String(printMarginPct));
}

// ============================================================
// 6. SYNC STATUS & ERROR LOG
// ============================================================

export interface SyncStatusEntry {
  id: number;
  syncType: string;
  status: string;
  recordsProcessed: number;
  recordsUpdated: number;
  recordsCreated: number;
  durationMs: number;
  errorMessage: string | null;
  startedAt: string;
}

export async function getSyncStatus(limit: number = 20): Promise<SyncStatusEntry[]> {
  const logs = await db.query.syncLog.findMany({
    orderBy: [desc(schema.syncLog.startedAt)],
    limit,
  });

  return logs.map(l => ({
    id: l.id,
    syncType: l.syncType,
    status: l.status,
    recordsProcessed: l.recordsProcessed || 0,
    recordsUpdated: l.recordsUpdated || 0,
    recordsCreated: l.recordsCreated || 0,
    durationMs: l.durationMs || 0,
    errorMessage: l.errorMessage,
    startedAt: l.startedAt.toISOString(),
  }));
}

export interface ErrorLogEntry {
  id: number;
  errorType: string;
  severity: string;
  message: string;
  context: any;
  orderId: number | null;
  orderNumber: string | null;
  resolved: boolean;
  createdAt: string;
}

export async function getErrorLog(params?: {
  resolved?: boolean;
  limit?: number;
}): Promise<ErrorLogEntry[]> {
  const conditions: any[] = [];

  if (params?.resolved !== undefined) {
    conditions.push(eq(schema.errorLog.resolved, params.resolved));
  }

  const errors = await db.query.errorLog.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(schema.errorLog.createdAt)],
    limit: params?.limit || 50,
  });

  const enriched: ErrorLogEntry[] = [];

  for (const err of errors) {
    let orderNumber: string | null = null;
    if (err.orderId) {
      const order = await db.query.orders.findFirst({
        where: eq(schema.orders.id, err.orderId),
      });
      orderNumber = order?.orderNumber || null;
    }

    enriched.push({
      id: err.id,
      errorType: err.errorType,
      severity: err.severity,
      message: err.message,
      context: err.context,
      orderId: err.orderId,
      orderNumber,
      resolved: err.resolved || false,
      createdAt: err.createdAt.toISOString(),
    });
  }

  return enriched;
}

// Resolve an error
export async function resolveError(errorId: number, adminUserId: number): Promise<void> {
  await db.update(schema.errorLog).set({
    resolved: true,
    resolvedAt: new Date(),
    resolvedBy: adminUserId,
  }).where(eq(schema.errorLog.id, errorId));
}

// ============================================================
// CATALOG STATS — For the product management section
// ============================================================

export async function getCatalogStats(): Promise<{
  totalProducts: number;
  visibleProducts: number;
  hiddenProducts: number;
  printableProducts: number;
  greenProducts: number;
  totalVariants: number;
  categoryCounts: Array<{ category: string; count: number }>;
  lastSyncAt: string | null;
}> {
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(schema.products);
  const visibleResult = await db.select({ count: sql<number>`count(*)` }).from(schema.products).where(eq(schema.products.isVisible, true));
  const printableResult = await db.select({ count: sql<number>`count(*)` }).from(schema.products).where(eq(schema.products.printable, true));
  const greenResult = await db.select({ count: sql<number>`count(*)` }).from(schema.products).where(eq(schema.products.isGreen, true));
  const variantResult = await db.select({ count: sql<number>`count(*)` }).from(schema.productVariants);

  const categoryResult = await db
    .select({
      category: schema.products.categoryLevel1,
      count: sql<number>`count(*)`,
    })
    .from(schema.products)
    .groupBy(schema.products.categoryLevel1)
    .orderBy(desc(sql`count(*)`));

  const lastSync = await db.query.syncLog.findFirst({
    where: eq(schema.syncLog.syncType, "products"),
    orderBy: [desc(schema.syncLog.startedAt)],
  });

  return {
    totalProducts: Number(totalResult[0].count),
    visibleProducts: Number(visibleResult[0].count),
    hiddenProducts: Number(totalResult[0].count) - Number(visibleResult[0].count),
    printableProducts: Number(printableResult[0].count),
    greenProducts: Number(greenResult[0].count),
    totalVariants: Number(variantResult[0].count),
    categoryCounts: categoryResult
      .filter(r => r.category)
      .map(r => ({ category: r.category!, count: Number(r.count) })),
    lastSyncAt: lastSync?.startedAt?.toISOString() || null,
  };
}

// ============================================================
// QUOTES MANAGEMENT
// ============================================================

export interface AdminQuote {
  id: number;
  quoteNumber: string;
  clientName: string;
  clientEmail: string;
  totalPrice: number;
  pdfUrl: string | null;
  status: "active" | "expired" | "converted";
  createdAt: string;
  expiresAt: string | null;
  convertedToOrderId: number | null;
  guestEmail: string | null;
}

export async function getAdminQuotes(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ quotes: AdminQuote[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 25;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];

  if (params?.search) {
    conditions.push(or(
      ilike(schema.quotes.quoteNumber, `%${params.search}%`),
      ilike(schema.quotes.guestEmail, `%${params.search}%`)
    ));
  }

  const now = new Date();

  if (params?.status) {
    if (params.status === 'converted') {
      conditions.push(sql`${schema.quotes.convertedToOrderId} IS NOT NULL`);
    } else if (params.status === 'expired') {
      conditions.push(and(
        sql`${schema.quotes.convertedToOrderId} IS NULL`,
        sql`${schema.quotes.expiresAt} < ${now}`
      ));
    } else if (params.status === 'active') {
      conditions.push(and(
        sql`${schema.quotes.convertedToOrderId} IS NULL`,
        or(sql`${schema.quotes.expiresAt} IS NULL`, sql`${schema.quotes.expiresAt} >= ${now}`)
      ));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.quotes)
    .where(whereClause);
  const total = Number(countResult[0].count);

  const quotesList = await db.query.quotes.findMany({
    where: whereClause,
    orderBy: [desc(schema.quotes.createdAt)],
    limit,
    offset,
  });

  const enriched: AdminQuote[] = [];

  for (const q of quotesList) {
    let status: "active" | "expired" | "converted" = "active";
    if (q.convertedToOrderId) {
      status = "converted";
    } else if (q.expiresAt && new Date(q.expiresAt) < now) {
      status = "expired";
    }

    // Try to get client string
    let clientName = "Guest";
    let clientEmail = q.guestEmail || "";
    if (q.userId) {
      const user = await db.query.users.findFirst({ where: eq(schema.users.id, q.userId) });
      if (user) {
        clientName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Cliente Registrado";
        clientEmail = user.email;
      }
    } else {
      // Might be in the cart_snapshot
      const snap = q.cartSnapshot as any;
      if (snap?.clientName) clientName = snap.clientName;
      if (snap?.clientEmail) clientEmail = snap.clientEmail;
    }

    enriched.push({
      id: q.id,
      quoteNumber: q.quoteNumber,
      clientName,
      clientEmail,
      totalPrice: parseFloat(q.totalPrice?.toString() || "0"),
      pdfUrl: q.pdfUrl,
      status,
      createdAt: q.createdAt.toISOString(),
      expiresAt: q.expiresAt?.toISOString() || null,
      convertedToOrderId: q.convertedToOrderId,
      guestEmail: q.guestEmail,
    });
  }

  return { quotes: enriched, total };
}
