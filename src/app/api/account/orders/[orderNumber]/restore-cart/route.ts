import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { requireAuth } from "@/lib/auth-service";

export async function GET(
    req: NextRequest,
    { params }: { params: { orderNumber: string } }
) {
    try {
        const auth = await requireAuth(
            req.headers.get("authorization"),
            "customer"
        );
        if ("error" in auth) {
            return NextResponse.json({ error: auth.error }, { status: auth.status });
        }

        const { orderNumber } = params;

        // Fetch the order
        const [order] = await db
            .select()
            .from(schema.orders)
            .where(eq(schema.orders.orderNumber, orderNumber))
            .limit(1);

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.userId !== auth.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        if (order.status !== "draft" && order.status !== "pending_payment") {
            return NextResponse.json({ error: "Sólo se pueden reactivar pedidos pendientes de pago" }, { status: 400 });
        }

        const lines = await db
            .select()
            .from(schema.orderLines)
            .where(eq(schema.orderLines.orderId, order.id));

        const cartItems = await Promise.all(lines.map(async (line) => {
            // Get product image from variants
            let productImage = "/images/placeholder-product.jpg";
            if (line.sku) {
                const variant = await db.query.productVariants.findFirst({
                    where: eq(schema.productVariants.sku, line.sku),
                });
                if (variant?.digitalAssets) {
                    const assets = variant.digitalAssets as any[];
                    const front = assets.find((a: any) => a.subtype === "item_picture_front");
                    if (front?.url) productImage = front.url;
                }
            }

            const isPrint = !!line.printConfig;

            return {
                productMasterCode: line.masterCode,
                productName: line.productName || "",
                productImage,
                variantId: line.variantId || "",
                variantSku: line.sku || "",
                color: line.colorDescription || "",
                size: line.size || undefined,
                quantity: line.quantity,
                unitPriceProduct: Number(line.unitPriceSell), // Simplified: we use the sold price
                unitPriceTotal: Number(line.unitPriceSell),
                totalPrice: Number(line.lineTotal),
                orderType: isPrint ? "PRINT" : "NORMAL",
                customization: isPrint ? line.printConfig : undefined,
                addedAt: Date.now()
            };
        }));

        return NextResponse.json({ success: true, items: cartItems });
    } catch (error: any) {
        console.error("[API] Restore Order Error:", error);
        return NextResponse.json({ error: "Error interno al recuperar los datos del pedido" }, { status: 500 });
    }
}
