import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { generateQuoteNumber, generateBuyUrl } from "@/lib/quote-pdf";
import { sendQuoteEmail } from "@/lib/email-service";
import type { CartItem } from "@/lib/configurator-engine";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { items, userId, guestEmail } = body as { items: CartItem[]; userId?: number; guestEmail?: string; };

        if (!items || items.length === 0) return NextResponse.json({ error: "No hay productos para presupuestar" }, { status: 400 });
        const email = guestEmail || (userId ? (await db.query.users.findFirst({ where: eq(schema.users.id, userId) }))?.email : null);
        if (!email) return NextResponse.json({ error: "Se necesita un email para enviar el presupuesto" }, { status: 400 });

        const countResult = await db.select({ count: schema.quotes.id }).from(schema.quotes).limit(1);
        const nextId = (countResult.length || 0) + 1;
        const quoteNumber = generateQuoteNumber(nextId);
        const buyUrl = generateBuyUrl(quoteNumber);

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 15);
        const totalPrice = items.reduce((sum, i) => sum + i.totalPrice, 0);

        await db.insert(schema.quotes).values({
            quoteNumber,
            userId: userId || null,
            guestEmail: !userId ? email : null,
            cartSnapshot: items as any,
            totalPrice: String(totalPrice),
            expiresAt,
            createdAt: new Date(),
        });

        let clientName = "Cliente";
        if (userId) {
            const user = await db.query.users.findFirst({ where: eq(schema.users.id, userId) });
            if (user) clientName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        }

        await sendQuoteEmail(email, {
            firstName: clientName.split(" ")[0] || "Cliente",
            quoteNumber,
            totalPrice: `${totalPrice.toFixed(2)} €`,
            pdfUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/quotes/${quoteNumber}/pdf`,
            buyUrl,
            expiresDate: expiresAt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        });

        return NextResponse.json({ success: true, quoteNumber, buyUrl, pdfUrl: `/api/quotes/${quoteNumber}/pdf`, expiresAt: expiresAt.toISOString() });
    } catch (error: any) {
        console.error("[API] Quote generation error:", error);
        return NextResponse.json({ error: "Error al generar el presupuesto" }, { status: 500 });
    }
}
