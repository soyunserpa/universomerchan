import { NextRequest, NextResponse } from "next/server";
import { sendProspectEmail } from "@/lib/email-service";

export async function POST(req: NextRequest) {
  try {
    const { targetEmail, subject, htmlBody } = await req.json();

    if (!targetEmail || !subject || !htmlBody) {
      return NextResponse.json({ error: "Faltan parámetros de envío." }, { status: 400 });
    }

    // A purely manual appearance format to look like a human wrote it
    const plainHumanTemplate = `
      <div style="font-family: Arial, sans-serif; font-size: 14px; color: #111; line-height: 1.6;">
        ${htmlBody}
        <br><br>
        <span style="color: #666; font-size: 12px; border-top: 1px solid #eee; display: block; padding-top: 10px; margin-top: 20px;">
          <strong>Universo Merchan</strong><br>
          <a href="https://universomerchan.com">universomerchan.com</a><br>
          <i>Especialistas en Merchandising Corporativo Premium</i>
        </span>
      </div>
    `;

    const success = await sendProspectEmail(targetEmail, subject, plainHumanTemplate);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Error enviando vía Google Apps Script" }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Prospect Send Error:", error);
    return NextResponse.json(
      { error: error.message || "Error interno enviando correo" },
      { status: 500 }
    );
  }
}
