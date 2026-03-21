import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import { customerApproveProof, customerRejectProof } from "@/lib/customer-account-api";

export async function POST(request: Request) {
    try {
        const user = await requireAuth(request);

        const body = await request.json();
        const { orderId, lineId, action, reason } = body;

        if (!orderId || !lineId || !action) {
            return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 });
        }

        if (action === "approve") {
            const result = await customerApproveProof(user.id, orderId, lineId);
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
        } else if (action === "reject") {
            if (!reason || reason.trim().length < 5) {
                return NextResponse.json({ error: "El motivo de rechazo es obligatorio y debe tener al menos 5 caracteres" }, { status: 400 });
            }
            const result = await customerRejectProof(user.id, orderId, lineId, reason);
            return NextResponse.json(result, { status: result.success ? 200 : 400 });
        } else {
            return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
        }

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
