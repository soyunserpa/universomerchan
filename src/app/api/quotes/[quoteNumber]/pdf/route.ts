import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { renderToStream } from "@react-pdf/renderer";
import { QuotePDF, generateBuyUrl } from "@/lib/quote-pdf";
import React from "react";

export async function GET(req: NextRequest, { params }: { params: { quoteNumber: string } }) {
    try {
        const quote = await db.query.quotes.findFirst({
            where: eq(schema.quotes.quoteNumber, params.quoteNumber)
        });

        if (!quote) {
            return new NextResponse("Presupuesto no encontrado", { status: 404 });
        }

        const items = (quote.cartSnapshot as any[]) || [];
        const subtotal = items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
        const total = parseFloat(quote.totalPrice);

        let clientName = "Cliente";
        let clientEmail = quote.guestEmail || "";

        if (quote.userId) {
            const user = await db.query.users.findFirst({ where: eq(schema.users.id, quote.userId) });
            if (user) {
                clientName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
                clientEmail = user.email || "";
            }
        }

        const quoteData = {
            quoteNumber: quote.quoteNumber,
            date: quote.createdAt?.toLocaleDateString("es-ES") || new Date().toLocaleDateString("es-ES"),
            validUntil: quote.expiresAt?.toLocaleDateString("es-ES") || new Date().toLocaleDateString("es-ES"),
            clientName,
            clientEmail,
            items: items.map(i => ({
                name: i.productName,
                color: i.color || "Personalizado",
                quantity: i.quantity,
                unitPrice: i.unitPriceTotal,
                customization: i.customization?.positions?.map((p: any) => p.techniqueName).join(" + ") || undefined,
                lineTotal: i.totalPrice
            })),
            subtotal,
            discount: 0,
            discountPct: 0,
            total,
            buyUrl: generateBuyUrl(quote.quoteNumber)
        };

        const stream = await renderToStream(React.createElement(QuotePDF, { data: quoteData }));

        return new Response(stream as any, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${quote.quoteNumber}.pdf"`,
            }
        });
    } catch (err: any) {
        console.error("[PDF Route] Error generating PDF:", err);
        return new NextResponse("Error interno al generar PDF", { status: 500 });
    }
}
