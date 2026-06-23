import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { leads } from "@/lib/schema";

export const dynamic = "force-dynamic";

// Captura de email del popup de bienvenida/salida → lead en el CRM.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().slice(0, 255);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ success: false, error: "invalid_email" }, { status: 400 });
    }
    await db.insert(leads).values({
      email,
      objective: "Popup descuento bienvenida (5%)",
      utmSource: "popup",
      utmMedium: "exit_intent",
      referer: String(body.referer || "").slice(0, 500) || null,
      status: "NEW",
    });
    console.log("🔥 [NUEVO LEAD POPUP] 🔥", email);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error lead-capture:", e);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
