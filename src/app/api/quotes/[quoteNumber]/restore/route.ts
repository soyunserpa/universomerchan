import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { CartItem } from "@/lib/configurator-engine";

export async function GET(
    req: NextRequest,
    { params }: { params: { quoteNumber: string } }
) {
    try {
        const { quoteNumber } = params;
        if (!quoteNumber) {
            return NextResponse.json({ error: "Missing quoteNumber" }, { status: 400 });
        }

        const [quote] = await db
            .select()
            .from(schema.quotes)
            .where(eq(schema.quotes.quoteNumber, quoteNumber));

        if (!quote) {
            return NextResponse.json({ error: "Presupuesto no encontrado" }, { status: 404 });
        }

        // Check expiration
        if (quote.expiresAt && new Date() > new Date(quote.expiresAt)) {
            return NextResponse.json({ error: "Presupuesto expirado" }, { status: 400 });
        }

        const snap = quote.cartSnapshot as any;
        if (!snap || !snap.product) {
            return NextResponse.json({ error: "Datos del presupuesto inválidos" }, { status: 400 });
        }

        const hasPrint = snap.zones && snap.zones.length > 0;

        // Determine mockup and artwork URLs if print
        let mainMockupUrl = null;
        if (hasPrint && snap.zones[0]?.mockupUrl) {
            mainMockupUrl = snap.zones[0].mockupUrl;
        }

        const cartItem: CartItem = {
            productMasterCode: snap.product.masterCode,
            productName: snap.product.name,
            // fallback in case variantSku isn't saved in quote
            variantSku: `${snap.product.masterCode}-${snap.product.colorCode || snap.product.color}`,
            variantId: `${snap.product.masterCode}-${snap.product.colorCode || snap.product.color}`,
            color: snap.product.color,
            colorCode: snap.product.colorCode,
            size: snap.product.size,
            quantity: snap.product.quantity,
            unitPriceProduct: snap.pricing.unitProductPrice,
            unitPriceTotal: snap.pricing.perUnit,
            totalPrice: snap.pricing.grandTotal,
            productImage: snap.product.imageUrl,
            orderType: hasPrint ? "PRINT" : "NORMAL",
            customization: hasPrint ? {
                positions: snap.zones.map((z: any) => ({
                    positionId: z.positionId,
                    positionName: z.positionName,
                    techniqueId: z.techniqueId,
                    techniqueName: z.techniqueName,
                    printWidthMm: z.printWidthMm || 50,
                    printHeightMm: z.printHeightMm || 50,
                    numColors: z.numColors || 1,
                    pmsColors: [],
                    instructions: "",
                })),
                artworkUrl: "", // Quotes might not store original artwork right now
                artworkFileName: "Logo adjunto en el visualizador",
                mockupUrl: mainMockupUrl,
            } : null,
        };

        return NextResponse.json({ items: [cartItem] }, { status: 200 });
    } catch (error: any) {
        console.error("[Quote Restore API] Error:", error);
        return NextResponse.json(
            { error: "Error interno al restaurar el presupuesto" },
            { status: 500 }
        );
    }
}
