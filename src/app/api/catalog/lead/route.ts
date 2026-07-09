import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { leads } from "@/lib/schema";
import { ensureCatalogCoupon } from "@/lib/catalog-magazine";
import { sendCatalogLeadEmail, sendCatalogLeadAdminNotice } from "@/lib/email-service";

// Imán de leads del catálogo: guarda el lead, garantiza el cupón de
// primer pedido y envía el email con el catálogo (PDF) + cupón.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = (body.email || "").trim();
    if (!email || !/.+@.+\..+/.test(email)) {
      return NextResponse.json({ success: false, error: "Email no válido" }, { status: 400 });
    }

    // 1) Guardar lead en el CRM (origen catálogo)
    const newLead = await db.insert(leads).values({
      email,
      companyName: body.companyName || null,
      objective: "Descarga de catálogo",
      utmSource: "catalogo",
      utmMedium: "lead_magnet",
      utmCampaign: "descarga_catalogo",
      referer: body.referer || null,
      status: "NEW",
    }).returning();

    console.log("🔥 [LEAD CATÁLOGO]", newLead[0]?.email);

    // 2) Garantizar cupón de primer pedido (10%)
    const coupon = await ensureCatalogCoupon();

    // 3) Emails (no bloqueamos la respuesta si fallan):
    //    - al cliente: catálogo + cupón
    //    - a Marina (universomerchan7@gmail.com): aviso de nuevo lead
    try {
      await Promise.allSettled([
        sendCatalogLeadEmail(email, { coupon }),
        sendCatalogLeadAdminNotice({ email, companyName: body.companyName || null }),
      ]);
    } catch (e) {
      console.error("[catalog/lead] email error:", (e as any)?.message);
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error("Error procesando lead de catálogo:", error);
    return NextResponse.json({ success: false, error: "No se ha podido procesar" }, { status: 500 });
  }
}
