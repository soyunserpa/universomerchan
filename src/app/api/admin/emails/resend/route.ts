import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-service";
import { db } from "@/lib/database";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";
import nodemailer from "nodemailer";

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

    // Enviar correo de nuevo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Universo Merchan" <${process.env.SMTP_FROM || 'hola@universomerchan.com'}>`,
      to: emailLog.recipientEmail,
      subject: emailLog.subject,
      html: emailLog.bodyHtml,
    });

    // Guardar registro de que se ha reenviado
    await db.insert(schema.emailLog).values({
      recipientEmail: emailLog.recipientEmail,
      emailType: emailLog.emailType,
      subject: `[REENVIADO] ${emailLog.subject}`,
      bodyHtml: emailLog.bodyHtml,
      status: "sent"
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Resend error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
