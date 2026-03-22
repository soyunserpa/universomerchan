// ============================================================
// UNIVERSO MERCHAN — Database Schema (Drizzle ORM + PostgreSQL)
// ============================================================
// This is the complete data model for the e-commerce platform.
// It covers: Midocean product sync, dual-margin pricing,
// B2B+B2C users, orders with Midocean API integration,
// proof approval flow, quotes/PDF, and admin config.
// ============================================================

import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============================================================
// ENUMS
// ============================================================

export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "draft",           // Carrito guardado / presupuesto
  "pending_payment", // Esperando pago Stripe
  "paid",            // Pagado, pendiente de enviar a Midocean
  "submitted",       // Enviado a Midocean via Order Entry API
  "proof_pending",   // Midocean ha generado proof, esperando aprobación cliente
  "proof_approved",  // Cliente aprobó proof → se envió Approve Proof API
  "proof_rejected",  // Cliente rechazó proof → se envió Reject Proof API
  "in_production",   // Midocean en producción
  "shipped",         // Enviado con tracking
  "completed",       // Entregado
  "cancelled",       // Cancelado
  "error",           // Error en cualquier paso
]);
export const orderTypeEnum = pgEnum("order_type", ["NORMAL", "PRINT", "SAMPLE"]);
export const proofStatusEnum = pgEnum("proof_status", [
  "not_applicable",   // Pedido sin marcaje
  "in_progress",      // Midocean creando proof
  "artwork_required", // Midocean necesita artwork
  "waiting_approval", // Proof listo, esperando aprobación del cliente
  "approved",         // Aprobado por cliente
  "rejected",         // Rechazado por cliente
]);

// ============================================================
// ADMIN SETTINGS
// ============================================================

export const adminSettings = pgTable("admin_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// Default rows to insert:
// { key: "margin_product_pct", value: "35", description: "% margen sobre precio base producto Midocean" }
// { key: "margin_print_pct", value: "45", description: "% margen sobre costes de impresión (setup+print+handling)" }
// { key: "midocean_api_key", value: "ENV", description: "Se lee de variable de entorno MIDOCEAN_API_KEY" }
// { key: "stripe_mode", value: "test", description: "test o live" }
// { key: "admin_email", value: "pedidos@universomerchan.com", description: "Email para notificaciones admin" }
// { key: "sync_products_interval_hours", value: "6", description: "Cada cuántas horas sincronizar productos" }
// { key: "sync_stock_interval_minutes", value: "30", description: "Cada cuántos minutos sincronizar stock" }

// ============================================================
// USERS — Dual system: customers (universomerchan.com) 
//          and admins (admin.universomerchan.com)
// ============================================================

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("customer").notNull(),
  
  // Customer fields (B2B + B2C)
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 30 }),
  companyName: varchar("company_name", { length: 200 }),  // Optional for B2C
  cif: varchar("cif", { length: 20 }),                     // Optional (B2B fills it)
  
  // Shipping address (default)
  shippingStreet: varchar("shipping_street", { length: 300 }),
  shippingCity: varchar("shipping_city", { length: 100 }),
  shippingPostalCode: varchar("shipping_postal_code", { length: 10 }),
  shippingCountry: varchar("shipping_country", { length: 2 }).default("ES"),
  
  // Per-client discount (set by admin from dashboard)
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  
  // Metadata
  emailVerified: boolean("email_verified").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
}, (table) => ({
  emailIdx: uniqueIndex("users_email_idx").on(table.email),
  roleIdx: index("users_role_idx").on(table.role),
}));

// ============================================================
// PRODUCTS — Synced from Midocean Product Information 2.0 API
// ============================================================

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  masterCode: varchar("master_code", { length: 20 }).notNull().unique(),
  masterId: varchar("master_id", { length: 20 }),
  
  // Product info
  productName: varchar("product_name", { length: 200 }).notNull(),
  shortDescription: text("short_description"),
  longDescription: text("long_description"),
  material: varchar("material", { length: 100 }),
  dimensions: varchar("dimensions", { length: 100 }),
  commodityCode: varchar("commodity_code", { length: 20 }),
  countryOfOrigin: varchar("country_of_origin", { length: 5 }),
  brand: varchar("brand", { length: 50 }),
  
  // Categories (from Midocean's category structure)
  categoryLevel1: varchar("category_level1", { length: 100 }),
  categoryLevel2: varchar("category_level2", { length: 100 }),
  categoryLevel3: varchar("category_level3", { length: 100 }),
  categoryCode: varchar("category_code", { length: 50 }),
  
  // Flags
  printable: boolean("printable").default(false),
  isGreen: boolean("is_green").default(false),         // Sustainable product
  numberOfPrintPositions: integer("number_of_print_positions").default(0),
  
  // Documents & certifications (stored as JSON array)
  digitalAssets: jsonb("digital_assets"),  // Array of { url, type, subtype }
  
  // Admin overrides
  isVisible: boolean("is_visible").default(true),       // Admin can hide products
  customPrice: decimal("custom_price", { precision: 10, scale: 4 }),  // Override price for specific product
  customDescription: text("custom_description"),         // Override description
  
  // Sync metadata
  lastSyncedAt: timestamp("last_synced_at"),
  rawApiData: jsonb("raw_api_data"),                    // Full Midocean API response for this product
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  masterCodeIdx: uniqueIndex("products_master_code_idx").on(table.masterCode),
  categoryIdx: index("products_category_idx").on(table.categoryLevel1),
  visibleIdx: index("products_visible_idx").on(table.isVisible),
  printableIdx: index("products_printable_idx").on(table.printable),
}));

// ============================================================
// PRODUCT VARIANTS — Colors/sizes per product
// ============================================================

export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  variantId: varchar("variant_id", { length: 20 }).notNull(),  // Midocean variant_id
  sku: varchar("sku", { length: 30 }).notNull(),
  
  colorDescription: varchar("color_description", { length: 50 }),
  colorGroup: varchar("color_group", { length: 50 }),
  colorCode: varchar("color_code", { length: 10 }),
  colorHex: varchar("color_hex", { length: 7 }),
  pmsColor: varchar("pms_color", { length: 20 }),
  size: varchar("size", { length: 20 }),                        // For textiles
  
  gtin: varchar("gtin", { length: 20 }),
  plcStatus: varchar("plc_status", { length: 10 }),
  plcStatusDescription: varchar("plc_status_description", { length: 50 }),
  releaseDate: varchar("release_date", { length: 10 }),
  
  // Images (stored as JSON array)
  digitalAssets: jsonb("digital_assets"),  // Array of { url, url_highres, type, subtype }
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  productIdx: index("variants_product_idx").on(table.productId),
  skuIdx: uniqueIndex("variants_sku_idx").on(table.sku),
  variantIdIdx: index("variants_variant_id_idx").on(table.variantId),
}));

// ============================================================
// STOCK — Synced from Midocean Stock Information 2.0 API
// Updated every 30 minutes via cron
// ============================================================

export const stock = pgTable("stock", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 30 }).notNull().unique(),
  variantId: integer("variant_id").references(() => productVariants.id),
  
  quantity: integer("quantity").default(0).notNull(),
  
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
}, (table) => ({
  skuIdx: uniqueIndex("stock_sku_idx").on(table.sku),
}));

// ============================================================
// PRODUCT PRICES — From Midocean Product Pricelist 2.0 API
// Supports scaled pricing (different price per quantity range)
// ============================================================

export const productPrices = pgTable("product_prices", {
  id: serial("id").primaryKey(),
  masterCode: varchar("master_code", { length: 20 }).notNull(),
  
  currency: varchar("currency", { length: 3 }).default("EUR"),
  pricelistValidFrom: varchar("pricelist_valid_from", { length: 10 }),
  pricelistValidUntil: varchar("pricelist_valid_until", { length: 10 }),
  
  // Scaled prices stored as JSON array: [{ min_qty, price }]
  priceScales: jsonb("price_scales").notNull(),  
  // Example: [{ "minimum_quantity": 1, "price": 4.82 }, { "minimum_quantity": 50, "price": 4.20 }, ...]
  
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
}, (table) => ({
  masterCodeIdx: index("prices_master_code_idx").on(table.masterCode),
}));

// ============================================================
// VARIANT PRICES — Per-SKU prices from Midocean Pricelist 2.0
// One row per SKU. Textiles may have different prices per size.
// The pricelist API returns { sku, variant_id, price, scale? }
// ============================================================

export const variantPrices = pgTable("variant_prices", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 30 }).notNull(),
  variantId: varchar("variant_id", { length: 20 }).notNull(),
  masterCode: varchar("master_code", { length: 20 }).notNull(),

  // Base price (always present) — stored as decimal, parsed from EU format
  price: decimal("price", { precision: 10, scale: 4 }).notNull(),

  // Quantity scales (only ~52 SKUs have these; null for the rest)
  // Format: [{ "minimum_quantity": 1, "price": 3.28 }, { "minimum_quantity": 500, "price": 2.99 }, ...]
  priceScales: jsonb("price_scales"),

  validUntil: varchar("valid_until", { length: 10 }),
  currency: varchar("currency", { length: 3 }).default("EUR"),

  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
}, (table) => ({
  skuIdx: uniqueIndex("variant_prices_sku_idx").on(table.sku),
  variantIdIdx: index("variant_prices_variant_id_idx").on(table.variantId),
  masterCodeIdx: index("variant_prices_master_code_idx").on(table.masterCode),
}));

// ============================================================
// PRINT DATA — From Midocean Print Data 1.0 API
// Defines what print positions & techniques are available per product
// ============================================================

export const printPositions = pgTable("print_positions", {
  id: serial("id").primaryKey(),
  masterCode: varchar("master_code", { length: 20 }).notNull(),
  
  positionId: varchar("position_id", { length: 30 }).notNull(),  // e.g. "FRONT", "BACK"
  positionDescription: varchar("position_description", { length: 100 }),
  
  maxPrintWidth: decimal("max_print_width", { precision: 8, scale: 2 }),   // mm
  maxPrintHeight: decimal("max_print_height", { precision: 8, scale: 2 }), // mm
  
  // Image showing the print zone on the product
  printPositionImage: text("print_position_image"),
  
  // Available techniques for this position (stored as JSON)
  // Array of { technique_id, technique_description, max_colors }
  availableTechniques: jsonb("available_techniques").notNull(),
  
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
}, (table) => ({
  masterCodeIdx: index("print_pos_master_code_idx").on(table.masterCode),
}));

// ============================================================
// PRINT PRICES — From Midocean Print Pricelist 2.0 API
// Covers all 4 pricing types: NumberOfColours, NumberOfPositions,
// AreaRange, ColourAreaRange
// ============================================================

export const printPrices = pgTable("print_prices", {
  id: serial("id").primaryKey(),
  
  techniqueId: varchar("technique_id", { length: 10 }).notNull(),  // e.g. "S2", "B", "L3"
  techniqueDescription: varchar("technique_description", { length: 100 }),
  pricingType: varchar("pricing_type", { length: 30 }).notNull(),   // NumberOfColours, NumberOfPositions, AreaRange, ColourAreaRange
  
  setup: decimal("setup", { precision: 10, scale: 2 }),
  setupRepeat: decimal("setup_repeat", { precision: 10, scale: 2 }),
  nextColourCostIndicator: boolean("next_colour_cost_indicator").default(false),
  
  // Variable costs stored as JSON (complex nested structure from Midocean)
  // Structure varies by pricing_type
  varCosts: jsonb("var_costs").notNull(),
  
  currency: varchar("currency", { length: 3 }).default("EUR"),
  pricelistValidFrom: varchar("pricelist_valid_from", { length: 10 }),
  pricelistValidUntil: varchar("pricelist_valid_until", { length: 10 }),
  
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
}, (table) => ({
  techniqueIdx: index("print_prices_technique_idx").on(table.techniqueId),
}));

// ============================================================
// PRINT MANIPULATIONS — Handling costs per product (from Print Pricelist)
// ============================================================

export const printManipulations = pgTable("print_manipulations", {
  id: serial("id").primaryKey(),
  masterCode: varchar("master_code", { length: 20 }).notNull(),
  
  // Handling cost (product-dependent, not print-config-dependent)
  handlingPriceScales: jsonb("handling_price_scales").notNull(),
  // [{ "minimum_quantity": 1, "price": 0.24 }, { "minimum_quantity": 50, "price": 0.18 }, ...]
  
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
}, (table) => ({
  masterCodeIdx: index("manipulations_master_code_idx").on(table.masterCode),
}));

// ============================================================
// ORDERS
// ============================================================

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 30 }).notNull().unique(), // UM-2026-XXXX
  userId: integer("user_id").notNull().references(() => users.id),
  
  // Status
  status: orderStatusEnum("status").default("draft").notNull(),
  orderType: orderTypeEnum("order_type").default("NORMAL").notNull(),
  
  // Midocean reference (set after Order Entry API call)
  midoceanOrderNumber: varchar("midocean_order_number", { length: 30 }),
  midoceanPoNumber: varchar("midocean_po_number", { length: 50 }),
  
  // Pricing breakdown (all in EUR)
  subtotalProduct: decimal("subtotal_product", { precision: 12, scale: 2 }).default("0"),
  subtotalPrint: decimal("subtotal_print", { precision: 12, scale: 2 }).default("0"),
  marginProductApplied: decimal("margin_product_applied", { precision: 5, scale: 2 }),  // % that was applied
  marginPrintApplied: decimal("margin_print_applied", { precision: 5, scale: 2 }),      // % that was applied
  
  // Coupons / Discounts
  couponCode: varchar("coupon_code", { length: 50 }),
  discountApplied: decimal("discount_applied", { precision: 5, scale: 2 }).default("0"), // Either % amount or monetary amount depending on coupon
  
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).default("0"),
  
  // Stripe
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 100 }),
  stripeSessionId: varchar("stripe_session_id", { length: 100 }),
  paidAt: timestamp("paid_at"),
  
  // Shipping
  shippingName: varchar("shipping_name", { length: 200 }),
  shippingCompany: varchar("shipping_company", { length: 200 }),
  shippingStreet: varchar("shipping_street", { length: 300 }),
  shippingPostalCode: varchar("shipping_postal_code", { length: 10 }),
  shippingCity: varchar("shipping_city", { length: 100 }),
  shippingCountry: varchar("shipping_country", { length: 2 }).default("ES"),
  shippingEmail: varchar("shipping_email", { length: 255 }),
  shippingPhone: varchar("shipping_phone", { length: 30 }),
  expressShipping: boolean("express_shipping").default(false),
  
  // Tracking (from Midocean Order Details API)
  trackingNumber: varchar("tracking_number", { length: 100 }),
  trackingUrl: text("tracking_url"),
  forwarder: varchar("forwarder", { length: 50 }),
  shippedAt: timestamp("shipped_at"),
  
  // Notes
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
  
  // Error handling
  lastError: text("last_error"),
  errorCount: integer("error_count").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  orderNumberIdx: uniqueIndex("orders_number_idx").on(table.orderNumber),
  userIdx: index("orders_user_idx").on(table.userId),
  statusIdx: index("orders_status_idx").on(table.status),
  midoceanIdx: index("orders_midocean_idx").on(table.midoceanOrderNumber),
}));

// ============================================================
// ORDER LINES — Products within an order
// ============================================================

export const orderLines = pgTable("order_lines", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(),
  
  // Product reference
  masterCode: varchar("master_code", { length: 20 }).notNull(),
  sku: varchar("sku", { length: 30 }),
  variantId: varchar("variant_id", { length: 20 }),
  productName: varchar("product_name", { length: 200 }),
  colorDescription: varchar("color_description", { length: 50 }),
  size: varchar("size", { length: 20 }),
  
  quantity: integer("quantity").notNull(),
  unitPriceMidocean: decimal("unit_price_midocean", { precision: 10, scale: 4 }),  // Cost from Midocean
  unitPriceSell: decimal("unit_price_sell", { precision: 10, scale: 4 }),           // Price to customer
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }),
  
  // Print configuration (null if no printing)
  printConfig: jsonb("print_config"),
  // Structure: {
  //   positions: [{
  //     id: "FRONT",
  //     technique_id: "S2",
  //     print_width: 45,
  //     print_height: 24,
  //     num_colors: 2,
  //     colors: [{ color: "PMS 0 C" }, { color: "PMS 485 C" }],
  //     artwork_url: "https://...",
  //     mockup_url: "https://...",
  //     instructions: ""
  //   }],
  //   print_items: [{ color_number: "03", size: "L", quantity: 50 }]
  // }
  
  // Print pricing breakdown
  printSetupCost: decimal("print_setup_cost", { precision: 10, scale: 2 }).default("0"),
  printCost: decimal("print_cost", { precision: 10, scale: 2 }).default("0"),
  printHandlingCost: decimal("print_handling_cost", { precision: 10, scale: 2 }).default("0"),
  printTotalCost: decimal("print_total_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Proof status for this line
  proofStatus: proofStatusEnum("proof_status").default("not_applicable"),
  proofUrl: text("proof_url"),
  proofApprovedAt: timestamp("proof_approved_at"),
  proofRejectedAt: timestamp("proof_rejected_at"),
  proofRejectionReason: text("proof_rejection_reason"),
  
  // Customer's uploaded artwork
  artworkUrl: text("artwork_url"),
  mockupUrl: text("mockup_url"),  // Generated preview from our visualizer
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  orderIdx: index("order_lines_order_idx").on(table.orderId),
}));

// ============================================================
// QUOTES / PRESUPUESTOS — Saved configurations that can become orders
// ============================================================

export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number", { length: 30 }).notNull().unique(),  // PRE-2026-XXXX
  userId: integer("user_id").references(() => users.id),
  
  // Can also be for anonymous users (email only)
  guestEmail: varchar("guest_email", { length: 255 }),
  
  // Full cart snapshot as JSON
  cartSnapshot: jsonb("cart_snapshot").notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }),
  
  // PDF
  pdfUrl: text("pdf_url"),
  
  // Conversion tracking
  convertedToOrderId: integer("converted_to_order_id").references(() => orders.id),
  convertedAt: timestamp("converted_at"),
  
  // Expiry
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  quoteNumberIdx: uniqueIndex("quotes_number_idx").on(table.quoteNumber),
  userIdx: index("quotes_user_idx").on(table.userId),
}));

// ============================================================
// COUPONS — Generic discount codes for cart
// ============================================================

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  
  // "percentage" | "fixed"
  discountType: varchar("discount_type", { length: 20 }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  
  // Rules
  minOrderValue: decimal("min_order_value", { precision: 10, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0).notNull(),
  
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  codeIdx: uniqueIndex("coupons_code_idx").on(table.code),
  statusIdx: index("coupons_status_idx").on(table.isActive),
}));

// ============================================================
// EMAIL LOG — Track all emails sent
// ============================================================

export const emailLog = pgTable("email_log", {
  id: serial("id").primaryKey(),
  
  recipientEmail: varchar("recipient_email", { length: 255 }).notNull(),
  recipientType: varchar("recipient_type", { length: 20 }).notNull(), // "customer" or "admin"
  
  emailType: varchar("email_type", { length: 50 }).notNull(),
  // Types: welcome, order_confirmation, proof_ready, proof_approved, 
  //        order_shipped, order_delivered, quote_generated, cart_abandoned,
  //        admin_new_order, admin_new_user, admin_proof_rejected, 
  //        admin_order_error, admin_order_completed, admin_low_stock
  
  subject: varchar("subject", { length: 300 }),
  orderId: integer("order_id").references(() => orders.id),
  
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveryStatus: varchar("delivery_status", { length: 20 }).default("sent"),
});

// ============================================================
// SYNC LOG — Track Midocean API synchronization runs
// ============================================================

export const syncLog = pgTable("sync_log", {
  id: serial("id").primaryKey(),
  
  syncType: varchar("sync_type", { length: 30 }).notNull(),
  // Types: products, stock, pricelist, print_pricelist, print_data
  
  status: varchar("status", { length: 20 }).notNull(), // "success", "error", "partial"
  recordsProcessed: integer("records_processed").default(0),
  recordsUpdated: integer("records_updated").default(0),
  recordsCreated: integer("records_created").default(0),
  
  durationMs: integer("duration_ms"),
  errorMessage: text("error_message"),
  
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// ============================================================
// ERROR LOG — Track operational errors for the admin dashboard
// ============================================================

export const errorLog = pgTable("error_log", {
  id: serial("id").primaryKey(),
  
  errorType: varchar("error_type", { length: 50 }).notNull(),
  // Types: stock_insufficient, order_api_error, proof_rejected,
  //        artwork_invalid, payment_failed, sync_error
  
  severity: varchar("severity", { length: 10 }).notNull(), // "low", "medium", "high", "critical"
  message: text("message").notNull(),
  context: jsonb("context"),  // Related IDs, details
  
  orderId: integer("order_id").references(() => orders.id),
  userId: integer("user_id").references(() => users.id),
  
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  typeIdx: index("errors_type_idx").on(table.errorType),
  resolvedIdx: index("errors_resolved_idx").on(table.resolved),
}));
