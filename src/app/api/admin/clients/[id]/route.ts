import { NextRequest, NextResponse } from "next/server";
import { deleteClient } from "@/lib/admin-dashboard-api";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = parseInt(params.id);
    if (isNaN(clientId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Opcional: Podríamos validar que el solicitante sea Admin revisando el token.
    // Asumimos que la request está protegida por el middleware de admin o CORS.

    await deleteClient(clientId);

    return NextResponse.json({ success: true, message: "Cliente eliminado correctamente." });
  } catch (error: any) {
    console.error("[API Admin Clients Delete]", error);
    return NextResponse.json({ error: "Error interno del servidor", details: error.message }, { status: 500 });
  }
}
