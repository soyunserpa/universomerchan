import { NextRequest, NextResponse } from "next/server";
import { notifyAdminContactForm } from "@/lib/email-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        const { nombre, email, telefono, empresa, asunto, mensaje, consentimiento } = body;
        
        if (!nombre || !email || !asunto || !mensaje || !consentimiento) {
            return NextResponse.json(
                { success: false, error: "Faltan campos obligatorios" }, 
                { status: 400 }
            );
        }

        const success = await notifyAdminContactForm({
            name: nombre,
            email,
            phone: telefono || "",
            company: empresa || "",
            subject: asunto,
            message: mensaje
        });

        if (!success) {
            throw new Error("No se pudo enviar el correo internamente.");
        }

        return NextResponse.json({ success: true, message: "Consulta enviada correctamente." });

    } catch (error: any) {
        console.error("[API Contacto] Error:", error);
        return NextResponse.json(
            { success: false, error: "Ha ocurrido un error inesperado al procesar la solicitud." }, 
            { status: 500 }
        );
    }
}
