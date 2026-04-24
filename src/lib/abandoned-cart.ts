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
// Now heavily batched: Sends at 10 AM (Madrid) for all of yesterday.
// ============================================================

export async function checkAbandonedCarts(): Promise<{
  emailsSent24h: number;
  emailsSent72h: number;
}> {
  const now = new Date();
  let emailsSent24h = 0;
  let emailsSent72h = 0;

  // We only want to execute the mail blast at 10:00 AM Europe/Madrid
  const madridFormatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', hour: '2-digit', hour12: false });
  const madridHour = parseInt(madridFormatter.format(now), 10);

  if (madridHour !== 10) {
    console.log(`[Abandoned Carts] Current Madrid hour is ${madridHour}. Skips mail blast until 10 AM.`);
    return { emailsSent24h, emailsSent72h };
  }

  // ── "Next Day" reminder (Day 1) at 10 AM ─────────────
  // A cart abandoned yesterday at 23:59 is ~10 hours old at 10 AM.
  // A cart abandoned yesterday at 00:00 is ~34 hours old at 10 AM.
  const tenHoursAgo = new Date(now.getTime() - 10 * 60 * 60 * 1000);
  const thirtyFourHoursAgo = new Date(now.getTime() - 34 * 60 * 60 * 1000);

  const abandonedDay1 = await db.query.orders.findMany({
    where: and(
      eq(schema.orders.status, "draft"),
      lt(schema.orders.createdAt, tenHoursAgo),
      gt(schema.orders.createdAt, thirtyFourHoursAgo),
    ),
  });

  for (const order of abandonedDay1) {
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

    const lines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, order.id),
    });

    const items = lines.map((l) => ({
      name: l.productName || "Producto",
      price: `${parseFloat(l.lineTotal?.toString() || "0").toFixed(2)} €`,
    }));

    const totalPrice = `${parseFloat(order.totalPrice?.toString() || "0").toFixed(2)} €`;

    const sent = await sendCartAbandonedEmail(user.email, {
      orderId: order.id,
      firstName: user.firstName || "Cliente",
      items,
      totalPrice,
      cartUrl: `${SITE_URL}/cart?restore=${order.orderNumber}`,
    });

    if (sent) emailsSent24h++;
  }

  // ── "3 Days Later" reminder (Day 3) at 10 AM ─────────────
  // Shift the window back by exactly 48 hours
  const fiftyEightHoursAgo = new Date(now.getTime() - 58 * 60 * 60 * 1000); // 10h + 48h
  const eightyTwoHoursAgo = new Date(now.getTime() - 82 * 60 * 60 * 1000); // 34h + 48h

  const abandonedDay3 = await db.query.orders.findMany({
    where: and(
      eq(schema.orders.status, "draft"),
      lt(schema.orders.createdAt, fiftyEightHoursAgo),
      gt(schema.orders.createdAt, eightyTwoHoursAgo),
    ),
  });

  for (const order of abandonedDay3) {
    const remindersSent = await db.query.emailLog.findMany({
      where: and(
        eq(schema.emailLog.orderId, order.id),
        eq(schema.emailLog.emailType, "cart_abandoned"),
      ),
    });

    if (remindersSent.length >= 2) continue; // Already received both

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
      orderId: order.id,
      firstName: user.firstName || "Cliente",
      items,
      totalPrice,
      cartUrl: `${SITE_URL}/cart?restore=${order.orderNumber}`,
    });

    if (sent) emailsSent72h++;
  }

  console.log(`[Abandoned Carts] Sent ${emailsSent24h} emails (Day 1) + ${emailsSent72h} emails (Day 3) @ 10:00 AM Madrid`);
  return { emailsSent24h, emailsSent72h };
}
