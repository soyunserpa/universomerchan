import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { orders, users, coupons, emailLog } from "@/lib/schema";
import { eq, and, sql, isNotNull } from "drizzle-orm";
import { sendReviewRequestEmail } from "@/lib/email-service";

const GOOGLE_REVIEWS_URL = "https://g.page/r/CR60aOSznIbUEAE/review";

// Esto se tiene que llamar desde un Cron Job diario a las 10:00 (UTC o tu hora local)
export async function GET(req: Request) {
  try {
    // 1. Validar Token de CRON
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    if (secret !== process.env.CRON_SECRET) {
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    console.log("[RequestReviews Cron] Iniciando escaneo de pedidos enviados hace > 6 días...");

    // 2. Buscar pedidos que hayan sido enviados hace al menos 6 días (144 horas)
    // Buscamos status >= shipped, pero para simplificar, confiamos en shippedAt
    const eligibleOrders = await db.query.orders.findMany({
      where: and(
        isNotNull(orders.shippedAt),
        sql`${orders.shippedAt} <= NOW() - INTERVAL '6 days'`,
        // Asegurarse de que no sean pedidos cancelados ni con error
        sql`${orders.status} NOT IN ('cancelled', 'error')`
      ),
      with: {
        user: true // join con la tabla de usuarios
      }
    });

    let sentCount = 0;
    
    for (const order of eligibleOrders) {
      if (!order.user || !order.user.email) continue;
      
      // 3. Comprobar si ya le hemos enviado el email ('review_request')
      const existingLog = await db.query.emailLog.findFirst({
        where: and(
          eq(emailLog.orderId, order.id),
          eq(emailLog.emailType, "review_request")
        )
      });

      if (existingLog) {
        // Ya se le envió en el pasado, saltamos.
        continue;
      }

      // 4. Fabricar el cupón del 5% dinámicamente
      const couponCode = `G5-${order.orderNumber.replace("UM-", "")}`;
      
      // Ver si por alguna razón rara ya existe
      const existingCoupon = await db.query.coupons.findFirst({
        where: eq(coupons.code, couponCode)
      });
      
      if (!existingCoupon) {
        const expiresInOneYear = new Date();
        expiresInOneYear.setFullYear(expiresInOneYear.getFullYear() + 1);

        await db.insert(coupons).values({
          code: couponCode,
          discountType: "percentage",
          discountValue: "5.00",
          usageLimit: 1,
          usageCount: 0,
          freeShipping: false,
          isActive: true,
          expiresAt: expiresInOneYear
        });
        console.log(`[RequestReviews Cron] Cupón creado: ${couponCode}`);
      }

      // 5. Enviar el Email
      const emailSent = await sendReviewRequestEmail(
        order.user.email,
        {
          firstName: order.user.firstName || order.shippingName?.split(" ")[0] || "Cliente",
          orderNumber: order.orderNumber,
          couponCode: couponCode,
          googleReviewUrl: GOOGLE_REVIEWS_URL
        }
      );

      // 6. Registrar en el Log si todo fue bien
      if (emailSent) {
        await db.insert(emailLog).values({
          recipientEmail: order.user.email,
          recipientType: "customer",
          emailType: "review_request",
          subject: "Tu opinión tiene premio: 5% de descuento en Universo Merchan",
          orderId: order.id,
          deliveryStatus: "sent"
        });
        sentCount++;
        console.log(`[RequestReviews Cron] ✅ Email de reseña enviado a ${order.user.email} (Pedido: ${order.orderNumber})`);
      }
    }

    return NextResponse.json({ success: true, processed: eligibleOrders.length, sent: sentCount });
    
  } catch (error: any) {
    console.error("[RequestReviews Cron] Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
