import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function GET(req: NextRequest, { params }: { params: { quoteNumber: string } }) {
    try {
        const quote = await db.query.quotes.findFirst({
            where: eq(schema.quotes.quoteNumber, params.quoteNumber),
        });

        if (!quote) return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
        if (quote.expiresAt && new Date() > new Date(quote.expiresAt)) return NextResponse.json({ error: "Este presupuesto ha expirado. Solicita uno nuevo." }, { status: 410 });
        if (quote.convertedToOrderId) return NextResponse.json({ error: "Este presupuesto ya fue convertido en un pedido.", orderNumber: quote.convertedToOrderId }, { status: 409 });

        let items = quote.cartSnapshot;
        if (typeof items === "string") {
            try { items = JSON.parse(items); } catch (e) { items = []; }
        }

        return NextResponse.json({ success: true, quoteNumber: quote.quoteNumber, items, totalPrice: quote.totalPrice, expiresAt: quote.expiresAt });
    } catch (error: any) {
        console.error("[API] Quote restore error:", error);
        return NextResponse.json({ error: "Error al recuperar el presupuesto" }, { status: 500 });
    }
}
