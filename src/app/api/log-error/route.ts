import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { notifyAdminSystemAlert } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Valiate minimal payload
    const { 
      errorType = "client_exception", 
      severity = "critical", 
      message, 
      context = {}, 
      url 
    } = data;
    
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Enhance context
    const fullContext = {
      ...context,
      url: url || "Unknown",
      timestamp: new Date().toISOString()
    };

    // Store in database
    const [log] = await db.insert(schema.errorLog).values({
      errorType: String(errorType).slice(0, 50),
      severity: String(severity).slice(0, 10),
      message: String(message),
      context: fullContext,
    }).returning();

    // Trigger immediate email alert for critical client exceptions or critical server errors
    if (severity === "critical") {
      try {
        await notifyAdminSystemAlert({
          subject: `🚨 CRITICAL ERROR: ${errorType}`,
          message: `
            <p><strong>Error:</strong> ${message}</p>
            <p><strong>URL:</strong> ${url || 'Desconocida'}</p>
            <p><strong>ID de Log:</strong> #${log.id}</p>
            ${context.stack ? `<div style="background:#f4f4f4;padding:10px;font-size:12px;margin-top:10px;white-space:pre-wrap;font-family:monospace;">${context.stack}</div>` : ''}
          `,
          alertLevel: "CRITICAL"
        });
      } catch (emailErr) {
        console.error("Failed to send error alert email:", emailErr);
      }
    }

    return NextResponse.json({ success: true, id: log.id });
  } catch (error) {
    console.error("Failed to process error log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
