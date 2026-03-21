import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { orderId, lineId, action, reason } = body as { orderId: number; lineId: number; action: "approve" | "reject"; reason?: string; };
        const { handleProofApproval } = await import("@/lib/cart-checkout");

        await handleProofApproval(orderId, lineId, action === "approve", reason);

        return NextResponse.json({
            success: true,
            message: action === "approve" ? "Boceto aprobado. Tu pedido entra en producción." : "Boceto rechazado. Midocean preparará una nueva versión.",
        });
    } catch (error: any) {
        console.error("[API] Proof action error:", error);
        return NextResponse.json({ error: error.message || "Error al procesar la acción" }, { status: 500 });
    }
}
