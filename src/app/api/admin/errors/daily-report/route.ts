import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { notifyAdminSystemAlert } from "@/lib/email-service";
import { gte } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    // Verificación básica de seguridad. En producción, esto debería llamarse con un token (ej. via Header o Query Param)
    // Para no bloquear la implementación rápida, lo dejamos abierto o puedes requerir un ?token=SECRET
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    // Optional basic protection
    if (process.env.CRON_SECRET && token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Calcular el rango de las últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const errors = await db.query.errorLog.findMany({
      where: gte(schema.errorLog.createdAt, yesterday),
      orderBy: (errorLog, { desc }) => [desc(errorLog.createdAt)]
    });

    if (errors.length === 0) {
      return NextResponse.json({ message: "No errors in the last 24 hours. No email sent." });
    }

    // Agrupar errores por severidad y tipo
    const pending = errors.filter(e => !e.resolved);
    const critical = errors.filter(e => e.severity === 'critical');

    let htmlMessage = `
      <p>Este es el resumen automatizado de incidencias de las últimas 24 horas.</p>
      <ul>
        <li><strong>Total de eventos registrados:</strong> ${errors.length}</li>
        <li><strong>Eventos pendientes de resolución:</strong> ${pending.length}</li>
        <li><strong style="color:red">Eventos críticos:</strong> ${critical.length}</li>
      </ul>
      <p>Entra en el <a href="https://universomerchan.com/admin/errors">Panel de Errores</a> para revisar los detalles.</p>
    `;

    if (critical.length > 0) {
      htmlMessage += `<h3>🚨 Últimos 5 Errores Críticos</h3><ul>`;
      critical.slice(0, 5).forEach(c => {
        htmlMessage += `<li><strong>${c.errorType}</strong>: ${c.message} <br/><span style="font-size:11px;color:#888">${new Date(c.createdAt).toLocaleString('es-ES')}</span></li>`;
      });
      htmlMessage += `</ul>`;
    }

    await notifyAdminSystemAlert({
      subject: `Resumen de Errores Diario: ${errors.length} incidencias (${pending.length} pendientes)`,
      message: htmlMessage,
      alertLevel: critical.length > 0 ? "CRITICAL" : "WARNING"
    });

    return NextResponse.json({ success: true, count: errors.length, pending: pending.length });
  } catch (error) {
    console.error("Failed to run daily error report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
