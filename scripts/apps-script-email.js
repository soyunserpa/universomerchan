// ============================================================
// UNIVERSO MERCHAN — Google Apps Script para envío de emails
// ============================================================
//
// INSTRUCCIONES DE INSTALACIÓN:
//
// 1. Ve a https://script.google.com
// 2. Inicia sesión con tu cuenta de Google 
//    (la misma de pedidos@universomerchan.com o tu Gmail)
// 3. Clic en "Nuevo proyecto"
// 4. Borra el contenido por defecto y pega TODO este código
// 5. Ponle nombre: "Universo Merchan Emails"
// 6. Guarda (Ctrl+S)
// 7. Clic en "Implementar" → "Nueva implementación"
// 8. Tipo: "Aplicación web"
// 9. Configuración:
//    - Descripción: "Envío de emails Universo Merchan"
//    - Ejecutar como: "Yo" (tu cuenta)
//    - Quién tiene acceso: "Cualquier persona"
// 10. Clic en "Implementar"
// 11. Te dará una URL tipo:
//     https://script.google.com/macros/s/XXXX.../exec
// 12. Copia esa URL y pégala en tu .env como:
//     APPS_SCRIPT_EMAIL_URL="https://script.google.com/macros/s/XXXX.../exec"
//
// ¡LISTO! Los emails se enviarán desde tu cuenta de Google.
//
// NOTAS:
// - Límite Gmail gratuito: 100 emails/día
// - Límite Google Workspace: 1.500 emails/día
// - Los emails aparecerán en tu carpeta "Enviados"
// - Si usas Google Workspace con pedidos@universomerchan.com,
//   los emails saldrán desde esa dirección
// - Si usas Gmail personal, saldrán desde tu Gmail
//
// ============================================================

// Clave secreta para verificar que las peticiones vienen de tu servidor
// Cámbiala por algo único y ponla también en tu .env como APPS_SCRIPT_SECRET
var SECRET_KEY = "universo-merchan-email-secret-2026";

/**
 * Maneja las peticiones POST desde tu servidor Next.js
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Verificar la acción solicitada
    if (data.action === "saveClient") {
      var clientSheetName = "Universo Merchan - Clientes Registrados";
      var files = DriveApp.getFilesByName(clientSheetName);
      var ss;
      
      if (files.hasNext()) {
        ss = SpreadsheetApp.open(files.next());
      } else {
        ss = SpreadsheetApp.create(clientSheetName);
        var sheet = ss.getActiveSheet();
        sheet.appendRow(["Fecha de Registro", "Email", "Nombre", "Apellidos", "Teléfono", "Empresa", "CIF", "Cliente ID"]);
        sheet.getRange(1, 1, 1, 8).setFontWeight("bold");
        sheet.setFrozenRows(1);
      }
      
      var sheet = ss.getActiveSheet();
      sheet.appendRow([
        new Date().toLocaleString("es-ES"),
        data.client.email || "",
        data.client.firstName || "",
        data.client.lastName || "",
        data.client.phone || "",
        data.client.companyName || "",
        data.client.cif || "",
        data.client.id || ""
      ]);
      
      return jsonResponse({ success: true, message: "Cliente guardado exitosamente en Google Sheets" });
    }

    // Verificar que la acción es enviar email
    if (data.action !== "sendEmail") {
      return jsonResponse({ success: false, error: "Acción no válida" });
    }
    
    // Validar campos requeridos
    if (!data.to || !data.subject || !data.htmlBody) {
      return jsonResponse({ success: false, error: "Faltan campos: to, subject, htmlBody" });
    }
    
    // Enviar email
    GmailApp.sendEmail(data.to, data.subject, "", {
      htmlBody: data.htmlBody,
      replyTo: data.replyTo || "pedidos@universomerchan.com",
      name: "Universo Merchan"
    });
    
    // Log para tracking
    logEmail(data.to, data.subject);
    
    return jsonResponse({ success: true, message: "Email enviado correctamente" });
    
  } catch (error) {
    // Log del error
    console.error("Error enviando email:", error.toString());
    return jsonResponse({ success: false, error: error.toString() });
  }
}

/**
 * Maneja GET requests (para verificar que el script funciona)
 */
function doGet(e) {
  return jsonResponse({
    status: "ok",
    service: "Universo Merchan Email Service",
    timestamp: new Date().toISOString(),
    message: "El servicio de email está activo. Usa POST para enviar emails."
  });
}

/**
 * Respuesta JSON estándar
 */
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Log de emails enviados en una hoja de cálculo (opcional pero útil)
 * Crea automáticamente una hoja "Email Log" en tu Google Drive
 */
function logEmail(to, subject) {
  try {
    var sheetName = "Universo Merchan - Email Log";
    var ss;
    
    // Buscar o crear la hoja de log
    var files = DriveApp.getFilesByName(sheetName);
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create(sheetName);
      var sheet = ss.getActiveSheet();
      sheet.appendRow(["Fecha", "Destinatario", "Asunto", "Estado"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    }
    
    var sheet = ss.getActiveSheet();
    sheet.appendRow([
      new Date().toLocaleString("es-ES"),
      to,
      subject,
      "Enviado"
    ]);
    
  } catch (logError) {
    // Si falla el log, no bloqueamos el envío
    console.error("Error en log:", logError.toString());
  }
}

/**
 * Función de test — Ejecuta esto manualmente para verificar
 * que el envío funciona antes de conectar con tu web
 */
function testEmail() {
  GmailApp.sendEmail(
    "TU_EMAIL_AQUI@gmail.com",  // ← Cambia por tu email para probar
    "🎁 Test Universo Merchan",
    "",
    {
      htmlBody: '<div style="font-family:Arial;padding:20px;"><h1 style="color:#DE0121;">¡Funciona!</h1><p>El servicio de email de Universo Merchan está correctamente configurado.</p><p style="color:#888;font-size:12px;">#GeneraEmociones</p></div>',
      name: "Universo Merchan"
    }
  );
  
  console.log("Email de test enviado correctamente");
}
