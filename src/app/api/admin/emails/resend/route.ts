import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

export async function POST(req: NextRequest) {
  try {
    await requireAuth(req.headers.get("authorization"), "admin");
    const { logId } = await req.json();

    if (!logId) return NextResponse.json({ error: "Missing logId" }, { status: 400 });

    const emailLog = await db.query.emailLog.findFirst({
      where: eq(schema.emailLog.id, logId)
    });

    if (!emailLog) return NextResponse.json({ error: "Email not found" }, { status: 404 });
    
    if (!emailLog.bodyHtml) {
      return NextResponse.json({ error: "No se puede reenviar este correo porque es antiguo y su contenido HTML no se almacenó." }, { status: 400 });
    }

    const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL;
    if (!APPS_SCRIPT_URL) {
      return NextResponse.json({ error: "APPS_SCRIPT_URL no está configurado." }, { status: 500 });
    }

    // Enviar correo de nuevo a través de Google Apps Script (igual que email-service.ts)
    const r = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "sendEmail", 
        to: emailLog.recipientEmail, 
        subject: emailLog.subject, 
        htmlBody: emailLog.bodyHtml, 
        replyTo: "hola@universomerchan.com" 
      }),
    });
    
    const res = await r.json();
    if (!res.success) {
      throw new Error(`Apps Script Error: ${res.error}`);
    }

    // Guardar registro de que se ha reenviado
    // @ts-ignore
    await db.insert(schema.emailLog).values({
      recipientEmail: emailLog.recipientEmail,
      recipientType: emailLog.recipientType,
      emailType: emailLog.emailType,
      subject: `[REENVIADO] ${emailLog.subject}`,
      bodyHtml: emailLog.bodyHtml,
      orderId: emailLog.orderId,
      status: "sent",
      createdAt: new Date()
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
