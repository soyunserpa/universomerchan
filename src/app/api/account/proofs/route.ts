import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/database";
import { eq, ne, desc, and, inArray } from "drizzle-orm";
import * as schema from "@/lib/schema";
import { requireAuth } from "@/lib/auth-service";

export async function GET(req: NextRequest) {
    const auth = await requireAuth(
        req.headers.get("authorization"),
        "customer"
    );
    if ("error" in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    try {
        // We want to fetch all order lines that have a proof requirement,
        // joined with their parent order for context, ensuring the order belongs to the user.

        // Note: Drizzle raw select allows joining tables easily
        const records = await db
            .select({
                order: schema.orders,
                line: schema.orderLines,
            })
            .from(schema.orderLines)
            .innerJoin(schema.orders, eq(schema.orders.id, schema.orderLines.orderId))
            .where(
                and(
                    eq(schema.orders.userId, auth.user.id),
                    inArray(schema.orderLines.proofStatus, ["waiting_approval", "rejected", "artwork_required", "approved"])
                )
            )
            .orderBy(desc(schema.orderLines.createdAt));

        // Map to a cleaner interface
        const proofs = records.map(({ order, line }) => {

            const config = line.printConfig as any;
            let customizationSummary: string | null = null;
            let techniqueNames: string[] = [];

            if (config?.positions?.length) {
                techniqueNames = config.positions.map(
                    (p: any) => p.techniqueName || p.techniqueId
                );
                customizationSummary = config.positions
                    .map(
                        (p: any) =>
                            `${p.positionName}: ${p.techniqueName || p.techniqueId}${p.numColors ? ` (${p.numColors} col.)` : ""
                            }`
                    )
                    .join(" + ");
            }

            return {
                orderId: order.id,
                orderNumber: order.orderNumber,
                orderCreatedAt: order.createdAt.toISOString(),
                orderStatus: order.status,
                lineId: line.id,
                lineNumber: line.lineNumber,
                productName: line.productName || "",
                masterCode: line.masterCode,
                color: line.colorDescription || "",
                quantity: line.quantity,
                proofStatus: line.proofStatus,
                proofUrl: line.proofUrl,
                artworkUrl: line.artworkUrl,
                mockupUrl: line.mockupUrl,
                proofRejectionReason: line.proofRejectionReason,
                customizationSummary,
                techniqueNames
            };
        });

        return NextResponse.json({ success: true, proofs });
    } catch (error: any) {
        console.error("[API] Get Proofs Error:", error);
        return NextResponse.json(
            { error: "Error al obtener los bocetos pendientes" },
            { status: 500 }
        );
    }
}
