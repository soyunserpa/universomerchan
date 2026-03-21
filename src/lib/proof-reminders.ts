import { db } from "./database";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import * as emails from "./email-service";

export async function checkPendingProofs() {
    console.log("[Cron] Checking for pending proofs older than 48h...");

    // Find order lines that have been waiting for approval for more than 48h
    // We use the updated_at timestamp from the order line or order to estimate when it went to "waiting_approval"
    // Since orderLines doesn't have an updatedAt, we estimate using order's updatedAt
    // or a direct SQL interval check if we assume proofStatus doesn't change after becoming "waiting_approval"

    const pendingLines = await db.execute(sql`
    SELECT 
      ol.id as line_id,
      ol.proof_status,
      ol.proof_url,
      ol.product_name,
      o.id as order_id,
      o.order_number,
      u.email,
      u.first_name
    FROM order_lines ol
    JOIN orders o ON o.id = ol.order_id
    JOIN users u ON u.id = o.user_id
    WHERE ol.proof_status = 'waiting_approval'
      AND o.status IN ('proof_pending', 'submitted')
      AND o.updated_at < NOW() - INTERVAL '48 hours'
  `);

    let count = 0;

    for (const row of pendingLines.rows || []) {
        const item = row as any;

        // Check if we already sent a reminder for this line
        const alreadyReminded = await db.query.errorLog.findFirst({
            where: sql`
        ${schema.errorLog.errorType} = 'proof_reminder'
        AND ${schema.errorLog.context}->>'lineId' = ${String(item.line_id)}
      `,
        });

        if (alreadyReminded) continue;

        // Log it so we only remind once
        await db.insert(schema.errorLog).values({
            errorType: "proof_reminder",
            severity: "info",
            message: `Recordatorio de boceto enviado para pedido ${item.order_number}`,
            orderId: item.order_id,
            context: { lineId: item.line_id },
            createdAt: new Date(),
        });

        // Send email
        if (item.email) {
            await emails.sendProofReminderEmail(item.email, {
                firstName: item.first_name || "Cliente",
                orderNumber: item.order_number,
                productName: item.product_name || "Producto personalizado",
                proofUrl: item.proof_url || "",
            });
            count++;
        }
    }

    if (count > 0) {
        console.log(`[Cron] Sent ${count} proof reminders`);
    }
}
