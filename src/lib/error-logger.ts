import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { notifyAdminSystemAlert } from "@/lib/email-service";

/**
 * Logs a server-side exception into the errorLog table and optionally sends an email alert.
 */
export async function logServerException(
  error: any,
  contextData: { 
    errorType?: string; 
    severity?: "low" | "medium" | "high" | "critical"; 
    url?: string;
    [key: string]: any;
  } = {}
) {
  try {
    const errorType = contextData.errorType || "server_exception";
    const severity = contextData.severity || "high";
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    
    const fullContext = {
      ...contextData,
      stack,
      timestamp: new Date().toISOString()
    };

    // Store in DB
    const [log] = await db.insert(schema.errorLog).values({
      errorType: String(errorType).slice(0, 50),
      severity: String(severity).slice(0, 10),
      message: String(message),
      context: fullContext,
    }).returning();

    // Notify for critical
    if (severity === "critical") {
      try {
        await notifyAdminSystemAlert({
          subject: `🚨 CRITICAL SERVER ERROR: ${errorType}`,
          message: `
            <p><strong>Error:</strong> ${message}</p>
            <p><strong>Context:</strong> ${JSON.stringify(contextData)}</p>
            <p><strong>ID de Log:</strong> #${log.id}</p>
            ${stack ? `<div style="background:#f4f4f4;padding:10px;font-size:12px;margin-top:10px;white-space:pre-wrap;font-family:monospace;">${stack}</div>` : ''}
          `,
          alertLevel: "CRITICAL"
        });
      } catch (emailErr) {
        console.error("Failed to send server error email:", emailErr);
      }
    }

    return log.id;
  } catch (loggingError) {
    console.error("FATAL: Failed to write to errorLog table", loggingError);
    return null;
  }
}
