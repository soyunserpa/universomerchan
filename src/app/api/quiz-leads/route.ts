import { NextResponse } from 'next/server';
// Puedes cambiar a usar drizzle/db si decides crear una tabla "leads"

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Aquí puedes:
    // 1. Guardarlo en la base de datos PostgreSQL local (Drizzle)
    // 2. Hacer forward a Klaviyo, Mailchimp, o Hubspot
    // 3. Enviar un email notecificando a admin de un nevo lead hiper-cualificado
    
    console.log("🔥 [NUEVO LEAD DE QUIZ - OCTANE STYLE] 🔥");
    console.log("Email capturado:", body.email);
    console.log("Empresa:", body.companyName);
    console.log("Sector:", body.industry);
    console.log("Objetivo:", body.objective);
    console.log("Presupuesto:", body.budget);
    
    // Future-proofing: Simular almacenamiento exitoso
    return NextResponse.json({ success: true, message: "Lead saved successfully." });
  } catch (error) {
    console.error("Error procesando lead del Quiz:", error);
    return NextResponse.json({ success: false, error: "Failed to process lead" }, { status: 500 });
  }
}
