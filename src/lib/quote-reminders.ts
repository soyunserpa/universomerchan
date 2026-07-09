// ============================================================
// UNIVERSO MERCHAN — Quote Expiry Reminders
// ============================================================
// Envía un email de recordatorio a los presupuestos que están
// a punto de caducar y todavía no se han convertido en pedido.
//
// Se ejecuta vía cron (1 vez al día):
//   GET https://universomerchan.com/api/cron/quote-reminders
//
// Anti-duplicado: comprueba email_log (emailType "quote_reminder"
// + asunto que contenga el número de presupuesto) → cada
// presupuesto recibe el recordatorio una sola vez.
// ============================================================

import { db } from "./database";
import { and, eq, gt, lte, isNull, like } from "drizzle-orm";
import * as schema from "./schema";
import { sendQuoteReminderEmail } from "./email-service";
import { generateBuyUrl } from "./quote-pdf";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

// Avisar cuando falten estos días (o menos) para que caduque.
const REMIND_BEFORE_DAYS = 3;

export async function checkExpiringQuotes(): Promise<{
  candidates: number;
  emailsSent: number;
  skippedAlreadySent: number;
  skippedNoEmail: number;
}> {
  const now = new Date();
  const threshold = new Date(now.getTime() + REMIND_BEFORE_DAYS * 24 * 60 * 60 * 1000);

  let emailsSent = 0;
  let skippedAlreadySent = 0;
  let skippedNoEmail = 0;

  // Presupuestos que caducan dentro de la ventana, no convertidos y aún vigentes.
  const expiring = await db.query.quotes.findMany({
    where: and(
      isNull(schema.quotes.convertedToOrderId),
      gt(schema.quotes.expiresAt, now),
      lte(schema.quotes.expiresAt, threshold),
    ),
  });

  for (const quote of expiring) {
    // ── Anti-duplicado: ¿ya se envió un recordatorio de este presupuesto? ──
    const alreadySent = await db.query.emailLog.findFirst({
      where: and(
        eq(schema.emailLog.emailType, "quote_reminder"),
        like(schema.emailLog.subject, `%${quote.quoteNumber}%`),
      ),
    });
    if (alreadySent) { skippedAlreadySent++; continue; }

    // ── Resolver email y nombre del cliente ──
    let email = quote.guestEmail || null;
    let firstName = "Cliente";
    if (quote.userId) {
      const user = await db.query.users.findFirst({ where: eq(schema.users.id, quote.userId) });
      if (user?.email) email = user.email;
      if (user?.firstName) firstName = user.firstName;
    }
    if (!email) { skippedNoEmail++; continue; }

    // ── Datos para el email ──
    const expiresAt = quote.expiresAt!;
    const msLeft = expiresAt.getTime() - now.getTime();
    const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
    const totalPrice = `${parseFloat(quote.totalPrice?.toString() || "0").toFixed(2)} €`;

    const sent = await sendQuoteReminderEmail(email, {
      firstName,
      quoteNumber: quote.quoteNumber,
      totalPrice,
      pdfUrl: `${SITE_URL}/api/quotes/${quote.quoteNumber}/pdf`,
      buyUrl: generateBuyUrl(quote.quoteNumber),
      expiresDate: expiresAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
      daysLeft,
    });

    if (sent) emailsSent++;
  }

  return {
    candidates: expiring.length,
    emailsSent,
    skippedAlreadySent,
    skippedNoEmail,
  };
}
