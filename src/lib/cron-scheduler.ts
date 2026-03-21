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

  console.log("[Cron] All jobs scheduled:");
  console.log("  • Stock sync:        every 30 min");
  console.log("  • Full product sync: every 6h");
  console.log("  • Order polling:     every 15 min");
  console.log("  • Abandoned carts:   every 1h");
}
