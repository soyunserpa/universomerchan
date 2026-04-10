// ============================================================
// UNIVERSO MERCHAN — Email Service via Google Apps Script
// ============================================================
// Emails sent through Apps Script deployed as Web App.
// Sends from Marina's Google account (pedidos@universomerchan.com).
//
// SETUP:
//   1. Go to script.google.com → New Project
//   2. Paste the APPS_SCRIPT_CODE (see apps-script-email.js)
//   3. Deploy → Web App → Execute as "Me" → Access "Anyone"
//   4. Copy deployment URL to .env APPS_SCRIPT_EMAIL_URL
// ============================================================

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_EMAIL_URL!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "pedidos@universomerchan.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

async function sendEmail(params: { to: string; subject: string; html: string }): Promise<boolean> {
  if (!APPS_SCRIPT_URL) { console.log(`[Email] (NO URL) To:${params.to} | ${params.subject}`); return false; }
  try {
    const r = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sendEmail", to: params.to, subject: params.subject, htmlBody: params.html, replyTo: ADMIN_EMAIL }),
    });
    const res = await r.json();
    if (res.success) { console.log(`[Email] ✓ "${params.subject}" → ${params.to}`); return true; }
    console.error(`[Email] ✗ ${res.error}`); return false;
  } catch (e: any) { console.error(`[Email] ✗ ${e.message}`); return false; }
}

function T(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background:#F5F5F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111}.container{max-width:600px;margin:0 auto;background:#FFF}.header{background:#DE0121;padding:24px 32px;text-align:center}.header h1{color:#fff;font-size:20px;font-weight:800;margin:0}.header p{color:rgba(255,255,255,.7);font-size:11px;margin:4px 0 0}.body{padding:32px}.footer{background:#111;color:#999;padding:24px 32px;text-align:center;font-size:11px}.footer a{color:#DE0121;text-decoration:none}.btn{display:inline-block;background:#DE0121;color:#fff!important;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0}.btn-dark{background:#111!important}.price-box{background:#111;color:#fff;border-radius:12px;padding:20px;margin:16px 0}.price-total{font-size:28px;font-weight:800;color:#DE0121}.ab{border-radius:12px;padding:16px;margin:16px 0}</style></head>
<body><span style="display:none;max-height:0;overflow:hidden">${preheader}</span>
<div class="container"><div class="header"><h1>Universo Merchan</h1><p>#GeneraEmociones</p></div>
<div class="body">${content}</div>
<div class="footer"><p>Universo Merchan · Madrid, España</p><p><a href="${SITE_URL}">universomerchan.com</a> · pedidos@universomerchan.com</p><p style="margin-top:12px;color:#666">Producción 80% europea · Entrega &lt;10 días</p></div></div></body></html>`;
}

// ── CUSTOMER EMAILS (8) ──────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string) {
  return sendEmail({ to, subject: "¡Bienvenido/a a Universo Merchan!", html: T(`<h2 style="font-size:24px;font-weight:800">¡Hola ${firstName}!</h2><p style="color:#666;line-height:1.7">Bienvenido/a a Universo Merchan. Explora más de 4.000 productos personalizables.</p><p style="text-align:center"><a href="${SITE_URL}/catalog" class="btn">Explorar catálogo</a></p>`, "Ya puedes personalizar productos") });
}

export async function sendOrderConfirmationEmail(to: string, d: { firstName: string; orderNumber: string; items: Array<{ name: string; quantity: number; color: string; technique?: string }>; totalPrice: string; estimatedDelivery: string; invoicePdfUrl?: string }) {
  const hasPrint = d.items.some(i => i.technique);
  const rows = d.items.map(i => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px">${i.name}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center">${i.quantity} uds</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right">${i.color}${i.technique ? ` · ${i.technique}` : ""}</td></tr>`).join("");
  const proofNotice = hasPrint ? `<div class="ab" style="background:#FEF3C7;margin-bottom:16px"><p style="font-size:13px;color:#92400E;margin:0"><strong>⏳ Próximo paso:</strong> Tu pedido incluye personalización. En las próximas 24-48h hábiles recibirás un nuevo email con el <strong>boceto final</strong> que deberás aprobar en tu panel antes de que pase a producción.</p></div>` : "";
  const invoiceBtn = d.invoicePdfUrl ? `<br><br><a href="${d.invoicePdfUrl}" class="btn btn-dark" style="margin-top:0">📄 Descargar Factura (PDF)</a>` : "";
  return sendEmail({ to, subject: `Pedido confirmado: ${d.orderNumber}`, html: T(`<h2 style="font-size:24px;font-weight:800">¡Pedido confirmado!</h2><p style="color:#666">Hola ${d.firstName}, hemos recibido tu pedido.</p>${proofNotice}<div style="background:#F9F9F9;border-radius:12px;padding:16px;margin:16px 0"><p style="font-size:13px;color:#888;margin:0 0 4px">Número de pedido</p><p style="font-size:20px;font-weight:800;color:#DE0121;margin:0">${d.orderNumber}</p></div><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #111"><th style="text-align:left;padding:8px 0;font-size:12px;color:#888">Producto</th><th style="text-align:center;padding:8px 0;font-size:12px;color:#888">Cant.</th><th style="text-align:right;padding:8px 0;font-size:12px;color:#888">Detalle</th></tr></thead><tbody>${rows}</tbody></table><div class="price-box"><p style="font-size:13px;color:#888;margin:0 0 4px">Total</p><p class="price-total" style="margin:0">${d.totalPrice}</p><p style="font-size:12px;color:#888;margin:8px 0 0">Entrega estimada: ${d.estimatedDelivery}</p></div><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">Ver mi pedido</a>${invoiceBtn}</p>`) });
}

export async function sendProofReadyEmail(to: string, d: { firstName: string; orderNumber: string; productName: string; proofUrl: string }) {
  return sendEmail({ to, subject: `Boceto listo: ${d.orderNumber}`, html: T(`<h2 style="font-size:24px;font-weight:800">Tu boceto está listo</h2><p style="color:#666">Hola ${d.firstName}, el boceto de <strong>${d.productName}</strong> (pedido ${d.orderNumber}) está listo.</p><div class="ab" style="background:#FEF3C7"><p style="font-size:13px;color:#92400E;margin:0"><strong>Acción requerida:</strong> Revisa y aprueba desde tu panel.</p></div><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">Revisar boceto</a></p>`) });
}

export async function sendProofReminderEmail(to: string, d: { firstName: string; orderNumber: string; productName: string; proofUrl: string }) {
  return sendEmail({ to, subject: `Recordatorio: Boceto pendiente de revisión ${d.orderNumber}`, html: T(`<h2 style="font-size:24px;font-weight:800">Tu boceto necesita revisión</h2><p style="color:#666">Hola ${d.firstName}, te recordamos que tienes pendiente de revisar el boceto de <strong>${d.productName}</strong> (pedido ${d.orderNumber}). Han pasado 48 horas y necesitamos tu aprobación para enviar a producción.</p><div class="ab" style="background:#FEF3C7"><p style="font-size:13px;color:#92400E;margin:0"><strong>Acción requerida:</strong> Revisa y aprueba desde tu panel lo antes posible.</p></div><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">Revisar boceto</a></p>`) });
}

export async function sendProofApprovedEmail(to: string, d: { firstName: string; orderNumber: string }) {
  return sendEmail({ to, subject: `Boceto aprobado — En producción: ${d.orderNumber}`, html: T(`<h2 style="font-size:24px;font-weight:800">¡En producción!</h2><p style="color:#666">Hola ${d.firstName}, el pedido <strong>${d.orderNumber}</strong> ya está en producción. Te avisaremos cuando se envíe (5-8 días).</p><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">Ver estado</a></p>`) });
}

export async function sendOrderShippedEmail(to: string, d: { firstName: string; orderNumber: string; trackingNumber: string; trackingUrl: string; forwarder: string }) {
  return sendEmail({ to, subject: `¡Tu pedido va en camino! ${d.orderNumber}`, html: T(`<h2 style="font-size:24px;font-weight:800">¡Pedido enviado!</h2><p style="color:#666">Hola ${d.firstName}, tu pedido <strong>${d.orderNumber}</strong> va en camino.</p><div class="ab" style="background:#D1FAE5"><p style="font-size:13px;color:#065F46;margin:0 0 4px">Transportista: <strong>${d.forwarder}</strong></p><p style="font-size:13px;color:#065F46;margin:0">Seguimiento: <strong>${d.trackingNumber}</strong></p></div><p style="text-align:center"><a href="${d.trackingUrl}" class="btn">Seguir mi envío</a></p>`) });
}

export async function sendOrderDeliveredEmail(to: string, d: { firstName: string; orderNumber: string }) {
  return sendEmail({ to, subject: `Pedido entregado: ${d.orderNumber}`, html: T(`<h2 style="font-size:24px;font-weight:800">¡Entregado!</h2><p style="color:#666">Hola ${d.firstName}, tu pedido <strong>${d.orderNumber}</strong> ha sido entregado.</p><p style="text-align:center"><a href="${SITE_URL}/catalog" class="btn">Hacer otro pedido</a></p>`) });
}

export async function sendQuoteEmail(to: string, d: { firstName: string; quoteNumber: string; totalPrice: string; pdfUrl: string; buyUrl: string; expiresDate: string }) {
  return sendEmail({ to, subject: `Presupuesto ${d.quoteNumber} — ${d.totalPrice}`, html: T(`<h2 style="font-size:24px;font-weight:800">Tu presupuesto</h2><p style="color:#666">Hola ${d.firstName}, aquí tienes tu presupuesto.</p><div style="background:#F9F9F9;border-radius:12px;padding:16px;margin:16px 0;text-align:center"><p style="font-size:13px;color:#888;margin:0 0 4px">${d.quoteNumber}</p><p style="font-size:28px;font-weight:800;color:#DE0121;margin:0">${d.totalPrice}</p><p style="font-size:12px;color:#888;margin:4px 0 0">Válido hasta ${d.expiresDate}</p></div><p style="text-align:center"><a href="${d.buyUrl}" class="btn">Comprar ahora</a><br><br><a href="${d.pdfUrl}" class="btn btn-dark">Descargar PDF</a></p>`) });
}

export async function sendCartAbandonedEmail(to: string, d: { firstName: string; items: Array<{ name: string; price: string }>; totalPrice: string; cartUrl: string }) {
  const list = d.items.map(i => `<div style="background:#F9F9F9;border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid #E5E7EB;"><strong style="color:#111;font-size:14px;display:block;margin-bottom:4px;">${i.name}</strong><span style="color:#666;font-size:13px;">${i.price}</span></div>`).join("");
  return sendEmail({ to, subject: "Tu configuración guardada en Universo Merchan", html: T(`<h2 style="font-size:24px;font-weight:800">¿Retomamos tu configuración?</h2><p style="color:#666;line-height:1.6;margin-bottom:24px;">Hola ${d.firstName}, hemos guardado los productos en los que mostraste interés para que no tengas que volver a configurarlos.</p><div style="margin-bottom:24px;">${list}</div><p style="font-weight:800;font-size:20px;color:#DE0121;text-align:right;margin-bottom:32px;">Importe total: ${d.totalPrice}</p><p style="text-align:center"><a href="${d.cartUrl}" class="btn">Retomar mi configuración</a></p>`) });
}

// ── ADMIN EMAILS (6) ─────────────────────────────────────────

export async function notifyAdminNewOrder(d: { orderNumber: string; clientName: string; clientEmail: string; totalPrice: string; items: Array<{ name: string; quantity: number }>; hasCustomization: boolean }) {
  const list = d.items.map(i => `<li>${i.name} × ${i.quantity}</li>`).join("");
  return sendEmail({ to: ADMIN_EMAIL, subject: `Nuevo pedido: ${d.orderNumber} — ${d.totalPrice}`, html: T(`<h2>Nuevo pedido</h2><div class="ab" style="background:#DBEAFE"><p style="margin:0"><strong>Pedido:</strong> ${d.orderNumber}</p><p style="margin:4px 0 0"><strong>Cliente:</strong> ${d.clientName} (${d.clientEmail})</p><p style="margin:4px 0 0"><strong>Total:</strong> ${d.totalPrice}</p><p style="margin:4px 0 0"><strong>Tipo:</strong> ${d.hasCustomization ? "CON MARCAJE" : "Sin marcaje"}</p></div><ul style="line-height:2">${list}</ul>`) });
}

export async function notifyAdminNewUser(d: { name: string; email: string; company?: string }) {
  return sendEmail({ to: ADMIN_EMAIL, subject: `Nuevo usuario: ${d.name}`, html: T(`<h2>Nuevo registro</h2><p><strong>Nombre:</strong> ${d.name}</p><p><strong>Email:</strong> ${d.email}</p>${d.company ? `<p><strong>Empresa:</strong> ${d.company}</p>` : ""}`) });
}

export async function notifyAdminProofRejected(d: { orderNumber: string; clientName: string; productName: string; reason: string }) {
  return sendEmail({ to: ADMIN_EMAIL, subject: `Proof rechazado: ${d.orderNumber}`, html: T(`<h2>Proof rechazado</h2><div class="ab" style="background:#FEE2E2"><p><strong>Pedido:</strong> ${d.orderNumber}</p><p><strong>Cliente:</strong> ${d.clientName}</p><p><strong>Producto:</strong> ${d.productName}</p><p><strong>Motivo:</strong> ${d.reason}</p></div>`) });
}

export async function notifyAdminOrderError(d: { orderNumber: string; errorType: string; message: string }) {
  return sendEmail({ to: ADMIN_EMAIL, subject: `Error: ${d.orderNumber}`, html: T(`<h2>Error en pedido</h2><div class="ab" style="background:#FEE2E2"><p><strong>Pedido:</strong> ${d.orderNumber}</p><p><strong>Tipo:</strong> ${d.errorType}</p><p><strong>Detalle:</strong> ${d.message}</p></div>`) });
}

export async function notifyAdminOrderShipped(d: { orderNumber: string; clientName: string; trackingNumber: string }) {
  return sendEmail({ to: ADMIN_EMAIL, subject: `Enviado: ${d.orderNumber}`, html: T(`<h2>Pedido enviado</h2><p><strong>Pedido:</strong> ${d.orderNumber}</p><p><strong>Cliente:</strong> ${d.clientName}</p><p><strong>Tracking:</strong> ${d.trackingNumber}</p>`) });
}

export async function notifyAdminLowStock(d: { productName: string; masterCode: string; sku: string; currentStock: number }) {
  return sendEmail({ to: ADMIN_EMAIL, subject: `Stock bajo: ${d.productName} (${d.currentStock} uds)`, html: T(`<h2>Stock bajo</h2><div class="ab" style="background:#FEF3C7"><p><strong>Producto:</strong> ${d.productName}</p><p><strong>SKU:</strong> ${d.sku}</p><p><strong>Stock:</strong> ${d.currentStock} uds</p></div>`) });
}

export async function notifyAdminContactForm(d: { name: string; email: string; phone: string; company: string; subject: string; message: string; }) {
  return sendEmail({ 
    to: ADMIN_EMAIL, 
    subject: `Consulta Web: ${d.subject || "Nuevo mensaje"}`, 
    html: T(`<h2>Nueva Consulta Web</h2>
    <div class="ab" style="background:#F3F4F6">
      <p style="margin:4px 0 0"><strong>Nombre:</strong> ${d.name}</p>
      <p style="margin:4px 0 0"><strong>Email:</strong> ${d.email}</p>
      <p style="margin:4px 0 0"><strong>Teléfono:</strong> ${d.phone || "-"}</p>
      <p style="margin:4px 0 0"><strong>Empresa:</strong> ${d.company || "-"}</p>
    </div>
    <div style="background:#FFFFFF;border-radius:12px;padding:16px;margin:16px 0;border:1px solid #E5E7EB;">
      <h3 style="margin-top:0"><strong>Asunto:</strong> ${d.subject}</h3>
      <p style="color:#444;line-height:1.6;white-space:pre-wrap;">${d.message}</p>
    </div>`) 
  });
}
