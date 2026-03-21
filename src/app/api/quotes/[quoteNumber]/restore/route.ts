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

        let items = quote.cartSnapshot as any;
        if (typeof items === "string") {
            try { items = JSON.parse(items); } catch (e) { items = []; }
        }

        // Compatibility mapper for single-product quotes from Visualizer (/api/quote/generate)
        if (items && !Array.isArray(items) && items.product) {
            const snap = items;
            items = [{
                productMasterCode: snap.product.masterCode || "",
                productName: snap.product.name || "Producto Personalizado",
                variantSku: `${snap.product.masterCode}${snap.product.colorCode ? "-" + snap.product.colorCode : ""}${snap.product.size ? "-" + snap.product.size : ""}`,
                variantId: `${snap.product.masterCode}${snap.product.colorCode ? "-" + snap.product.colorCode : ""}`,
                color: snap.product.color || "",
                colorCode: snap.product.colorCode || "",
                size: snap.product.size || "",
                quantity: snap.product.quantity || 1,
                unitPriceProduct: snap.pricing?.unitProductPrice || 0,
                unitPriceTotal: snap.pricing?.perUnit || 0,
                totalPrice: snap.pricing?.grandTotal || 0,
                customization: (snap.zones && snap.zones.length > 0) ? {
                    positions: snap.zones.map((z: any) => ({
                        positionId: z.positionId || "",
                        positionName: z.positionName || "",
                        techniqueId: z.techniqueId || "",
                        techniqueName: z.techniqueName || "",
                        printWidthMm: z.printWidthMm || 0,
                        printHeightMm: z.printHeightMm || 0,
                        numColors: z.numColors || 1,
                        pmsColors: [],
                        instructions: ""
                    })),
                    artworkUrl: snap.zones[0]?.mockupUrl || "",
                    artworkFileName: "Diseño pre-aprobado",
                    mockupUrl: snap.zones[0]?.mockupUrl || null,
                } : null,
                orderType: (snap.zones && snap.zones.length > 0) ? "PRINT" : "NORMAL",
                productImage: snap.product.imageUrl || ""
            }];
        } else if (!Array.isArray(items)) {
            items = []; // Fallback to empty cart if completely malformed
        }

        return NextResponse.json({ success: true, quoteNumber: quote.quoteNumber, items, totalPrice: quote.totalPrice, expiresAt: quote.expiresAt });
    } catch (error: any) {
        console.error("[API] Quote restore error:", error);
        return NextResponse.json({ error: "Error al recuperar el presupuesto" }, { status: 500 });
    }
}
