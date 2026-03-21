// ============================================================
// UNIVERSO MERCHAN — Cron Scheduler
// ============================================================
// All background jobs that run automatically.
// This module is imported in the app startup.
//
// Schedule:
//   Every 30 min:  Sync stock from Midocean
//   Every 6h:      Sync products, prices, print data
//   Every 15 min:  Poll active order statuses from Midocean
//   Every 1h:      Check for abandoned carts → send emails
//   Every 24h:     Check for low stock on popular products
// ============================================================

import { db } from "./database";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { notifyAdminLowStock } from "./email-service";
import { checkPendingProofs } from "./proof-reminders";

let isInitialized = false;

export function startCronJobs() {
  if (isInitialized) return;
  isInitialized = true;

  console.log("[Cron] Starting background job scheduler...");

  // ── Stock sync: every 30 minutes ──────────────────────────
  cron.schedule("*/30 * * * *", async () => {
    console.log("[Cron] Running stock sync...");
    try {
      await syncStock();
    } catch (error: any) {
      console.error("[Cron] Stock sync failed:", error.message);
    }
  });

  // ── Full product sync: every 6 hours ──────────────────────
  cron.schedule("0 */6 * * *", async () => {
    console.log("[Cron] Running full product sync...");
    try {
      await syncProducts();
      await syncPricelist();
      await syncPrintPricelist();
      await syncPrintData();
    } catch (error: any) {
      console.error("[Cron] Full sync failed:", error.message);
    }
  });

  // ── Order status polling: every 15 minutes ────────────────
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Polling active order statuses...");
    try {
      await syncActiveOrders();
    } catch (error: any) {
      console.error("[Cron] Order polling failed:", error.message);
    }
  });

  // ── Abandoned cart emails & Proof reminders: every hour ──────
  cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Checking abandoned carts and proof reminders...");
    try {
      await checkAbandonedCarts();
      await checkPendingProofs();
    } catch (error: any) {
      console.error("[Cron] Hourly check failed:", error.message);
    }
  });

  // ── Low stock alerts: daily at 9am ────────────────────────
  cron.schedule("0 9 * * *", async () => {
    console.log("[Cron] Checking low stock products...");
    try {
      await checkLowStock();
    } catch (error: any) {
      console.error("[Cron] Low stock check failed:", error.message);
    }
  });

  console.log("[Cron] All jobs scheduled:");
  console.log("  • Stock sync:        every 30 min");
  console.log("  • Full product sync: every 6h");
  console.log("  • Order polling:     every 15 min");
  console.log("  • Abandoned carts:   every 1h");
  console.log("  • Low stock alerts:  daily at 9am");
}

// ============================================================
// LOW STOCK CHECK
// Alerts admin when popular products go below threshold
// ============================================================

async function checkLowStock() {
  // Get threshold from settings (default: 100)
  const thresholdSetting = await db.query.adminSettings.findFirst({
    where: sql`${schema.adminSettings.key} = 'low_stock_threshold'`,
  });
  const threshold = parseInt(thresholdSetting?.value || "100");

  // Find low-stock SKUs that have been ordered recently
  const lowStockItems = await db.execute(sql`
    SELECT 
      s.sku,
      s.quantity,
      pv.color_description,
      p.product_name,
      p.master_code
    FROM stock s
    JOIN product_variants pv ON pv.sku = s.sku
    JOIN products p ON p.id = pv.product_id
    WHERE s.quantity < ${threshold}
      AND s.quantity > 0
      AND p.is_visible = true
    ORDER BY s.quantity ASC
    LIMIT 20
  `);

  for (const item of lowStockItems.rows || []) {
    // Only alert once per SKU per day
    const alreadyAlerted = await db.query.errorLog.findFirst({
      where: sql`
        ${schema.errorLog.errorType} = 'low_stock'
        AND ${schema.errorLog.context}->>'sku' = ${(item as any).sku}
        AND ${schema.errorLog.createdAt} > NOW() - INTERVAL '24 hours'
      `,
    });

    if (alreadyAlerted) continue;

    // Log it
    await db.insert(schema.errorLog).values({
      errorType: "low_stock",
      severity: "medium",
      message: `Stock bajo: ${(item as any).product_name} (${(item as any).sku}) — ${(item as any).quantity} uds`,
      context: { sku: (item as any).sku, quantity: (item as any).quantity },
      createdAt: new Date(),
    });

    // Email admin
    await notifyAdminLowStock({
      productName: (item as any).product_name,
      masterCode: (item as any).master_code,
      sku: (item as any).sku,
      currentStock: (item as any).quantity,
    });
  }
}
