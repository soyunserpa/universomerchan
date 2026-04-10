// ============================================================
// UNIVERSO MERCHAN — Abandoned Cart Recovery
// ============================================================
// Detects carts that were abandoned (items added but no checkout)
// and sends reminder emails at 24h and 72h.
//
// Run via cron: every hour
//   0 * * * * npx tsx scripts/check-abandoned-carts.ts
//
// Only sends to logged-in users (we need their email).
// ============================================================

import { db } from "./database";
import { eq, and, lt, gt, sql, isNull } from "drizzle-orm";
import * as schema from "./schema";
import { sendCartAbandonedEmail } from "./email-service";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

// ============================================================
// Check for abandoned draft orders (created but never paid)
// ============================================================

export async function checkAbandonedCarts(): Promise<{
  emailsSent24h: number;
  emailsSent72h: number;
}> {
  let emailsSent24h = 0;
  let emailsSent72h = 0;

  const now = new Date();

  // ── 24-hour reminder ───────────────────────────────────────
  // Orders in "draft" status created 24-26 hours ago (2h window)
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const twentySixHoursAgo = new Date(now.getTime() - 26 * 60 * 60 * 1000);

  const abandoned24h = await db.query.orders.findMany({
    where: and(
      eq(schema.orders.status, "draft"),
      lt(schema.orders.createdAt, twentyFourHoursAgo),
      gt(schema.orders.createdAt, twentySixHoursAgo),
    ),
  });

  for (const order of abandoned24h) {
    // Check if we already sent a 24h reminder
    const alreadySent = await db.query.emailLog.findFirst({
      where: and(
        eq(schema.emailLog.orderId, order.id),
        eq(schema.emailLog.emailType, "cart_abandoned"),
      ),
    });

    if (alreadySent) continue;

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, order.userId),
    });
    if (!user?.email) continue;

    // Get order lines for the email
    const lines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, order.id),
    });

    const items = lines.map((l) => ({
      name: l.productName || "Producto",
      price: `${parseFloat(l.lineTotal?.toString() || "0").toFixed(2)} €`,
    }));

    const totalPrice = `${parseFloat(order.totalPrice?.toString() || "0").toFixed(2)} €`;

    const sent = await sendCartAbandonedEmail(user.email, {
      firstName: user.firstName || "Cliente",
      items,
      totalPrice,
      cartUrl: `${SITE_URL}/cart?restore=${order.orderNumber}`,
    });

    if (sent) {
      emailsSent24h++;
      // @ts-ignore - Bypass Drizzle ORM strict type inference bug
      await db.insert(schema.emailLog).values({
        recipientEmail: user.email,
        recipientType: "customer",
        emailType: "cart_abandoned",
        subject: "Tienes productos esperándote",
        orderId: order.id,
        sentAt: new Date(),
        deliveryStatus: "sent",
      });
    }
  }

  // ── 72-hour reminder ───────────────────────────────────────
  // Orders in "draft" status created 72-74 hours ago
  const seventyTwoHoursAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const seventyFourHoursAgo = new Date(now.getTime() - 74 * 60 * 60 * 1000);

  const abandoned72h = await db.query.orders.findMany({
    where: and(
      eq(schema.orders.status, "draft"),
      lt(schema.orders.createdAt, seventyTwoHoursAgo),
      gt(schema.orders.createdAt, seventyFourHoursAgo),
    ),
  });

  for (const order of abandoned72h) {
    // Check if we already sent a 72h reminder
    const remindersSent = await db.query.emailLog.findMany({
      where: and(
        eq(schema.emailLog.orderId, order.id),
        eq(schema.emailLog.emailType, "cart_abandoned"),
      ),
    });

    if (remindersSent.length >= 2) continue; // Already sent both reminders

    const user = await db.query.users.findFirst({
      where: eq(schema.users.id, order.userId),
    });
    if (!user?.email) continue;

    const lines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, order.id),
    });

    const items = lines.map((l) => ({
      name: l.productName || "Producto",
      price: `${parseFloat(l.lineTotal?.toString() || "0").toFixed(2)} €`,
    }));

    const totalPrice = `${parseFloat(order.totalPrice?.toString() || "0").toFixed(2)} €`;

    const sent = await sendCartAbandonedEmail(user.email, {
      firstName: user.firstName || "Cliente",
      items,
      totalPrice,
      cartUrl: `${SITE_URL}/cart?restore=${order.orderNumber}`,
    });

    if (sent) {
      emailsSent72h++;
      await db.insert(schema.emailLog).values({
        recipientEmail: user.email,
        recipientType: "customer",
        emailType: "cart_abandoned",
        subject: "Tienes productos esperándote (recordatorio)",
        orderId: order.id,
        sentAt: new Date(),
        deliveryStatus: "sent",
      });
    }
  }

  console.log(
    `[Abandoned Carts] Sent ${emailsSent24h} emails (24h) + ${emailsSent72h} emails (72h)`
  );

  return { emailsSent24h, emailsSent72h };
}
