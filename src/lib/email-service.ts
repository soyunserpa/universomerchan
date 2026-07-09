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

import { db } from "./database";
import * as schema from "./schema";

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_EMAIL_URL!;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "pedidos@universomerchan.com";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  emailType: string;
  recipientType: "customer" | "admin";
  orderId?: number;
}

async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!APPS_SCRIPT_URL) { console.log(`[Email] (NO URL) To:${params.to} | ${params.subject}`); return false; }
  
  let success = false;
  let deliveryStatus = "failed";

  try {
    const r = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sendEmail", to: params.to, subject: params.subject, htmlBody: params.html, replyTo: ADMIN_EMAIL }),
    });
    const res = await r.json();
    if (res.success) { 
      console.log(`[Email] ✓ "${params.subject}" → ${params.to}`); 
      success = true; 
      deliveryStatus = "sent";
    } else {
      console.error(`[Email] ✗ ${res.error}`);
    }
  } catch (e: any) { 
    console.error(`[Email] ✗ ${e.message}`); 
  }

  // Insert to DB log
  try {
    // @ts-ignore - Bypass Drizzle ORM strict inference bug
    await db.insert(schema.emailLog).values({
      recipientEmail: params.to,
      recipientType: params.recipientType,
      emailType: params.emailType,
      subject: params.subject,
      orderId: params.orderId,
      sentAt: new Date(),
      deliveryStatus,
    });
  } catch (dbErr: any) {
    console.error(`[Email DB Log Error] ✗ ${dbErr.message}`);
  }

  return success;
}

function T(content: string, preheader: string = ""): string {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>body{margin:0;padding:0;background:#F5F5F5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#111}.container{max-width:600px;margin:0 auto;background:#FFF}.header{background:#DE0121;padding:24px 32px;text-align:center}.header h1{color:#fff;font-size:20px;font-weight:800;margin:0}.header p{color:rgba(255,255,255,.7);font-size:11px;margin:4px 0 0}.body{padding:32px}.footer{background:#111;color:#999;padding:24px 32px;text-align:center;font-size:11px}.footer a{color:#DE0121;text-decoration:none}.btn{display:inline-block;background:#DE0121;color:#fff!important;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0}.btn-dark{background:#111!important}.price-box{background:#111;color:#fff;border-radius:12px;padding:20px;margin:16px 0}.price-total{font-size:28px;font-weight:800;color:#DE0121}.ab{border-radius:12px;padding:16px;margin:16px 0}</style></head>
<body><span style="display:none;max-height:0;overflow:hidden">${preheader}</span>
<div class="container"><div class="header"><h1>Universo Merchan</h1><p>#GeneraEmociones</p></div>
<div class="body">${content}</div>
<div class="footer"><p>Universo Merchan · Madrid, España</p><p><a href="${SITE_URL}">universomerchan.com</a> · pedidos@universomerchan.com</p><p style="margin-top:12px;color:#666">Producción 80% europea · Entrega &lt;10 días</p></div></div></body></html>`;
}

// ── PROSPECT EMAILS ──────────────────────────────────────
export async function sendProspectEmail(to: string, subject: string, htmlContent: string) {
  // Wrap the htmlContent in the standard Layout (T) 
  // but since it's a prospect, we might just want to send it directly so it looks like a plain email!
  // It's a hack: if we don't use 'T(htmlContent)', it sends raw HTML.
  return sendEmail({
    emailType: "cold_prospect",
    recipientType: "customer",
    to,
    subject,
    html: htmlContent // Raw direct inject so it looks like a manual email, not a newsletter
  });
}

// ── CATÁLOGO (Imán de leads) ─────────────────────────────
// Envía el catálogo (link al PDF + versión online) y el cupón de primer pedido.
export async function sendCatalogLeadEmail(to: string, d: { coupon: string }) {
  const html = T(
    `<h2 style="font-size:24px;font-weight:800;margin:0 0 8px">¡Aquí tienes nuestro catálogo! 🎁</h2>
     <p style="color:#666;line-height:1.7;margin:0 0 20px">Gracias por tu interés en Universo Merchan. Descárgalo en PDF o explóralo online cuando quieras.</p>
     <p style="text-align:center;margin:0 0 8px"><a href="${SITE_URL}/api/catalog/pdf" class="btn">📄 Descargar catálogo (PDF)</a></p>
     <p style="text-align:center;margin:0 0 24px"><a href="${SITE_URL}/catalogo" class="btn btn-dark">📖 Ver catálogo online</a></p>
     <div class="ab" style="background:#FDECEE;border:1px solid #DE0121;text-align:center">
       <p style="margin:0 0 4px;font-size:13px;color:#666">Tu descuento de primer pedido</p>
       <p style="margin:0;font-size:30px;font-weight:800;color:#DE0121;letter-spacing:2px">${d.coupon}</p>
       <p style="margin:6px 0 0;font-size:12px;color:#888">10% de descuento · aplícalo al finalizar tu compra</p>
     </div>
     <p style="color:#666;line-height:1.7;margin:20px 0 0">¿Tienes un producto en mente? Personalizamos cualquier artículo con tu marca. Respóndenos a este email y te ayudamos.</p>
     <p style="text-align:center;margin:20px 0 0"><a href="${SITE_URL}/catalog" class="btn">Ir a la tienda</a></p>`,
    "Tu catálogo de Universo Merchan + 10% de descuento"
  );
  return sendEmail({
    emailType: "catalog_lead",
    recipientType: "customer",
    to,
    subject: "Tu catálogo de Universo Merchan + un 10% para estrenar 🎁",
    html,
  });
}

// Aviso INTERNO a Marina cuando alguien descarga el catálogo (nuevo lead).
const LEAD_ALERT_EMAIL = process.env.LEAD_ALERT_EMAIL || process.env.STOCK_ALERT_EMAIL || "universomerchan7@gmail.com";
export async function sendCatalogLeadAdminNotice(d: { email: string; companyName?: string | null }) {
  const html = T(
    `<h2 style="font-size:22px;font-weight:800;margin:0 0 8px">🧲 Nuevo lead — descarga de catálogo</h2>
     <p style="color:#666;margin:0 0 16px">Alguien acaba de pedir el catálogo desde la web:</p>
     <div style="background:#F9F9F9;border-radius:12px;padding:16px;margin:0 0 16px">
       <p style="margin:0;font-size:16px;font-weight:800">${d.email}</p>
       ${d.companyName ? `<p style="margin:6px 0 0;font-size:13px;color:#555">Empresa: ${d.companyName}</p>` : ""}
       <p style="margin:6px 0 0;font-size:12px;color:#888">Origen: catálogo (imán de leads) · ya tiene su cupón del 10%</p>
     </div>
     <p style="font-size:12px;color:#888;margin:0">Lo tienes también en el CRM: <a href="${SITE_URL}/admin" style="color:#DE0121">/admin</a></p>`,
    "Nuevo lead de catálogo"
  );
  return sendEmail({
    emailType: "catalog_lead_admin",
    recipientType: "admin",
    to: LEAD_ALERT_EMAIL,
    subject: `🧲 Nuevo lead de catálogo: ${d.email}`,
    html,
  });
}

// ── STOCK ALERT (Avísame) ────────────────────────────────
// Aviso interno a operaciones cuando un cliente pide ser avisado de un producto agotado.
const STOCK_ALERT_EMAIL = process.env.STOCK_ALERT_EMAIL || "universomerchan7@gmail.com";
export async function sendStockNotifyRequest(d: { customerEmail: string; productName: string; masterCode: string }) {
  const html = T(
    `<h2 style="font-size:22px;font-weight:800">🔔 Solicitud de aviso de stock</h2>
     <p style="color:#666">Un cliente quiere que le avisen cuando este producto vuelva a estar disponible:</p>
     <div style="background:#F9F9F9;border-radius:12px;padding:16px;margin:16px 0">
       <p style="font-size:18px;font-weight:800;margin:0">${d.productName}</p>
       <p style="font-size:13px;color:#888;margin:4px 0 0">Ref: ${d.masterCode}</p>
     </div>
     <p style="color:#111">Email del cliente: <strong>${d.customerEmail}</strong></p>
     <p style="font-size:12px;color:#888;margin-top:16px">Cuando vuelva a haber stock, avísale a este email.</p>`,
    "Solicitud de aviso de stock"
  );
  return sendEmail({
    emailType: "stock_alert_request",
    recipientType: "admin",
    to: STOCK_ALERT_EMAIL,
    subject: `🔔 Aviso de stock solicitado: ${d.productName} (${d.masterCode})`,
    html,
  });
}

// ── CUSTOMER EMAILS ──────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string) {
  return sendEmail({ emailType: "welcome", recipientType: "customer", to, subject: `Bienvenido/a a Universo Merchan, ${firstName} 👋`, html: T(`<h2 style="font-size:24px;font-weight:800;margin:0 0 12px">¡Hola ${firstName}! Encantados de tenerte aquí</h2><p style="color:#555;line-height:1.7;margin:0 0 20px">En Universo Merchan convertimos productos en <strong>merchandising que tu equipo y tus clientes quieren tener</strong>: lo personalizamos con tu marca y lo cuidamos de principio a fin.</p><table style="width:100%;border-collapse:collapse;margin:0 0 20px"><tr><td style="padding:7px 0;font-size:14px;color:#444">✨ <strong>+2.000 productos</strong> listos para llevar tu logo</td></tr><tr><td style="padding:7px 0;font-size:14px;color:#444;border-top:1px solid #f0f0f0">🎨 <strong>Lo ves antes de comprar</strong>: personalizas y previsualizas en segundos</td></tr><tr><td style="padding:7px 0;font-size:14px;color:#444;border-top:1px solid #f0f0f0">🚚 <strong>Producción 80% europea</strong> y entrega en menos de 10 días</td></tr></table><p style="text-align:center;margin:0 0 8px"><a href="${SITE_URL}/catalog" class="btn">Explorar el catálogo</a></p><p style="color:#777;line-height:1.7;font-size:13px;margin:24px 0 0">¿Tienes un proyecto en mente o un presupuesto que cuadrar? Responde a este email y te asesoramos sin compromiso.</p><p style="color:#111;font-size:13px;margin:16px 0 0">Un abrazo,<br><strong>El equipo de Universo Merchan</strong></p>`, `${firstName}, así de fácil es lucir tu marca en +2.000 productos`) });
}

import { translateEmail } from "./email-locales";

export async function sendOrderConfirmationEmail(to: string, locale: string = "es", d: { orderId?: number; firstName: string; orderNumber: string; items: Array<{ name: string; quantity: number; color: string; technique?: string }>; totalPrice: string; estimatedDelivery: string; invoicePdfUrl?: string }) {
  const hasPrint = d.items.some(i => i.technique);
  const rows = d.items.map(i => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px">${i.name}</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:center">${i.quantity} uds</td><td style="padding:8px 0;border-bottom:1px solid #f0f0f0;font-size:14px;text-align:right">${i.color}${i.technique ? ` · ${i.technique}` : ""}</td></tr>`).join("");
  
  const subjectText = translateEmail(locale, "order_confirmation_subject", `Pedido confirmado: ${d.orderNumber}`, { orderNumber: d.orderNumber });
  const titleText = translateEmail(locale, "order_confirmation_title", "¡Pedido confirmado!");
  const helloText = translateEmail(locale, "order_confirmation_hello", `Hola ${d.firstName}, hemos recibido tu pedido.`, { firstName: d.firstName });
  const proofText = translateEmail(locale, "order_confirmation_proof", "<strong>⏳ Próximo paso:</strong> Tu pedido incluye personalización. En las próximas 24-48h hábiles recibirás un nuevo email con el <strong>boceto final</strong> que deberás aprobar en tu panel antes de que pase a producción.");
  
  const proofNotice = hasPrint ? `<div class="ab" style="background:#FEF3C7;margin-bottom:16px"><p style="font-size:13px;color:#92400E;margin:0">${proofText}</p></div>` : "";
  const invoiceBtn = d.invoicePdfUrl ? `<br><br><a href="${d.invoicePdfUrl}" class="btn btn-dark" style="margin-top:0">📄 Descargar Factura (PDF)</a>` : "";
  
  const orderNumberLabel = translateEmail(locale, "order_number", "Número de pedido");
  const productLabel = translateEmail(locale, "product", "Producto");
  const qtyLabel = translateEmail(locale, "qty", "Cant.");
  const detailLabel = translateEmail(locale, "detail", "Detalle");
  const totalLabel = translateEmail(locale, "total", "Total");
  const deliveryLabel = translateEmail(locale, "delivery_estimated", `Entrega estimada: ${d.estimatedDelivery}`, { estimatedDelivery: d.estimatedDelivery });
  const viewOrderBtn = translateEmail(locale, "view_my_order", "Ver mi pedido");
  const thanksText = translateEmail(locale, "order_confirmation_thanks", "¡Gracias por confiar en Universo Merchan! Estamos encantados de poner tu marca en marcha.");
  const preheaderText = translateEmail(locale, "order_confirmation_preheader", `Hemos recibido tu pedido ${d.orderNumber}. Aquí tienes el resumen.`, { orderNumber: d.orderNumber });

  return sendEmail({ emailType: "order_confirmation", recipientType: "customer", orderId: d.orderId, to, subject: subjectText, html: T(`<h2 style="font-size:24px;font-weight:800">${titleText}</h2><p style="color:#555;line-height:1.7">${helloText}</p>${proofNotice}<div style="background:#F9F9F9;border-radius:12px;padding:16px;margin:16px 0"><p style="font-size:13px;color:#888;margin:0 0 4px">${orderNumberLabel}</p><p style="font-size:20px;font-weight:800;color:#DE0121;margin:0">${d.orderNumber}</p></div><table style="width:100%;border-collapse:collapse"><thead><tr style="border-bottom:2px solid #111"><th style="text-align:left;padding:8px 0;font-size:12px;color:#888">${productLabel}</th><th style="text-align:center;padding:8px 0;font-size:12px;color:#888">${qtyLabel}</th><th style="text-align:right;padding:8px 0;font-size:12px;color:#888">${detailLabel}</th></tr></thead><tbody>${rows}</tbody></table><div class="price-box"><p style="font-size:13px;color:#888;margin:0 0 4px">${totalLabel}</p><p class="price-total" style="margin:0">${d.totalPrice}</p><p style="font-size:12px;color:#888;margin:8px 0 0">${deliveryLabel}</p></div><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">${viewOrderBtn}</a>${invoiceBtn}</p><p style="color:#777;line-height:1.7;font-size:13px;margin:24px 0 0">${thanksText}</p>`, preheaderText) });
}

export async function sendProofReadyEmail(to: string, d: { orderId?: number; firstName: string; orderNumber: string; productName: string; proofUrl: string }) {
  return sendEmail({ emailType: "proof_ready", recipientType: "customer", orderId: d.orderId, to, subject: `¡Mira cómo queda tu marca! Boceto listo (${d.orderNumber})`, html: T(`<h2 style="font-size:24px;font-weight:800">Tu boceto ya está listo 🎨</h2><p style="color:#555;line-height:1.7">Hola ${d.firstName}, hemos preparado el boceto de <strong>${d.productName}</strong> (pedido ${d.orderNumber}). Échale un vistazo: cuando le des el visto bueno, pasa directo a producción.</p><div class="ab" style="background:#FEF3C7"><p style="font-size:13px;color:#92400E;margin:0"><strong>Solo falta tu OK:</strong> revisa y aprueba el boceto desde tu panel.</p></div><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">Ver y aprobar mi boceto</a></p><p style="color:#777;font-size:13px;text-align:center;margin:16px 0 0">¿Quieres cambiar algún detalle? Respóndenos y lo ajustamos.</p>`, `${d.firstName}, tu boceto está listo — un vistazo y a producción`) });
}

export async function sendProofReminderEmail(to: string, d: { orderId?: number; firstName: string; orderNumber: string; productName: string; proofUrl: string }) {
  return sendEmail({ emailType: "proof_reminder", recipientType: "customer", orderId: d.orderId, to, subject: `${d.firstName}, solo te falta aprobar tu boceto (${d.orderNumber})`, html: T(`<h2 style="font-size:24px;font-weight:800">Estás a un clic de producción</h2><p style="color:#555;line-height:1.7">Hola ${d.firstName}, tu boceto de <strong>${d.productName}</strong> (pedido ${d.orderNumber}) sigue esperando tu visto bueno. En cuanto lo apruebes, lo ponemos en marcha; sin tu OK no enviamos nada a producción.</p><div class="ab" style="background:#FEF3C7"><p style="font-size:13px;color:#92400E;margin:0"><strong>Un último paso:</strong> revisa y aprueba el boceto desde tu panel.</p></div><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">Aprobar mi boceto</a></p><p style="color:#777;font-size:13px;text-align:center;margin:16px 0 0">¿Algo que afinar antes de aprobar? Responde a este email y lo vemos juntos.</p>`, `Un clic y lo enviamos a producción. Estamos listos cuando tú lo estés.`) });
}

export async function sendProofApprovedEmail(to: string, d: { orderId?: number; firstName: string; orderNumber: string }) {
  return sendEmail({ emailType: "proof_approved", recipientType: "customer", orderId: d.orderId, to, subject: `¡Manos a la obra! Tu pedido ${d.orderNumber} ya está en producción 🎉`, html: T(`<h2 style="font-size:24px;font-weight:800">¡Aprobado y en producción! 🎉</h2><p style="color:#555;line-height:1.7">Hola ${d.firstName}, gracias por tu visto bueno. Tu pedido <strong>${d.orderNumber}</strong> ya está en producción y nuestro equipo lo está cuidando al detalle. Te avisaremos en cuanto salga hacia ti (normalmente en 5-8 días).</p><p style="text-align:center"><a href="${SITE_URL}/account/orders" class="btn">Seguir mi pedido</a></p>`, `Todo en marcha. Te avisamos en cuanto tu pedido salga hacia ti.`) });
}

export async function sendOrderShippedEmail(to: string, d: { orderId?: number; firstName: string; orderNumber: string; trackingNumber: string; trackingUrl: string; forwarder: string }) {
  return sendEmail({ emailType: "order_shipped", recipientType: "customer", orderId: d.orderId, to, subject: `¡En camino! Tu pedido ${d.orderNumber} ya viaja hacia ti 🚚`, html: T(`<h2 style="font-size:24px;font-weight:800">¡Tu pedido va en camino! 🚚</h2><p style="color:#555;line-height:1.7">Hola ${d.firstName}, buenas noticias: tu pedido <strong>${d.orderNumber}</strong> acaba de salir y ya viaja hacia ti.</p><div class="ab" style="background:#D1FAE5"><p style="font-size:13px;color:#065F46;margin:0 0 4px">Transportista: <strong>${d.forwarder}</strong></p><p style="font-size:13px;color:#065F46;margin:0">Nº de seguimiento: <strong>${d.trackingNumber}</strong></p></div><p style="text-align:center"><a href="${d.trackingUrl}" class="btn">Seguir mi envío en tiempo real</a></p>`, `${d.firstName}, sigue tu pedido ${d.orderNumber} en tiempo real`) });
}

export async function sendOrderDeliveredEmail(to: string, d: { orderId?: number; firstName: string; orderNumber: string }) {
  return sendEmail({ emailType: "order_delivered", recipientType: "customer", orderId: d.orderId, to, subject: `¿Ha llegado todo perfecto, ${d.firstName}?`, html: T(`<h2 style="font-size:24px;font-weight:800">¡Tu pedido ya está ahí! 🎁</h2><p style="color:#555;line-height:1.7">Hola ${d.firstName}, nos consta que tu pedido <strong>${d.orderNumber}</strong> ha sido entregado. Esperamos que a tu equipo le encante tanto como a nosotros nos ha gustado prepararlo.</p><p style="color:#555;line-height:1.7">Si algo no está como esperabas, respóndenos a este email: lo resolvemos rápido y bien.</p><p style="color:#777;line-height:1.7;font-size:13px;margin:20px 0 0">Y cuando llegue vuestra próxima campaña, evento o regalo corporativo, aquí estaremos para ayudarte a generar emociones de nuevo.</p><p style="color:#111;font-size:13px;margin:16px 0 0">Gracias por confiar en nosotros,<br><strong>El equipo de Universo Merchan</strong></p>`, `Esperamos que tu equipo lo disfrute. Estamos a un mensaje de distancia.`) });
}

export async function sendQuoteEmail(to: string, d: { quoteId?: number; firstName: string; quoteNumber: string; totalPrice: string; pdfUrl: string; buyUrl: string; expiresDate: string }) {
  return sendEmail({ emailType: "quote_generated", recipientType: "customer", orderId: d.quoteId, to, subject: `Tu presupuesto está listo: ${d.totalPrice} (${d.quoteNumber})`, html: T(`<h2 style="font-size:24px;font-weight:800">Aquí tienes tu presupuesto</h2><p style="color:#555;line-height:1.7">Hola ${d.firstName}, hemos preparado tu presupuesto con todo a medida. Cuando quieras confirmarlo, lo dejamos en marcha en un clic.</p><div style="background:#F9F9F9;border-radius:12px;padding:16px;margin:16px 0;text-align:center"><p style="font-size:13px;color:#888;margin:0 0 4px">${d.quoteNumber}</p><p style="font-size:28px;font-weight:800;color:#DE0121;margin:0">${d.totalPrice}</p><p style="font-size:12px;color:#888;margin:4px 0 0">Precio reservado hasta el ${d.expiresDate}</p></div><p style="text-align:center"><a href="${d.buyUrl}" class="btn">Confirmar mi pedido</a><br><br><a href="${d.pdfUrl}" class="btn btn-dark">Descargar en PDF</a></p><p style="color:#777;font-size:13px;text-align:center;margin:16px 0 0">¿Quieres ajustar unidades, colores o productos? Responde a este email y lo adaptamos a ti.</p>`, `${d.firstName}, tu presupuesto de ${d.totalPrice} — precio reservado hasta el ${d.expiresDate}`) });
}

export async function sendQuoteReminderEmail(to: string, d: { firstName: string; quoteNumber: string; totalPrice: string; pdfUrl: string; buyUrl: string; expiresDate: string; daysLeft: number }) {
  const urgency = d.daysLeft <= 1
    ? `Tu presupuesto caduca <strong>hoy</strong>`
    : `Tu presupuesto caduca en <strong>${d.daysLeft} días</strong>`;
  return sendEmail({
    emailType: "quote_reminder",
    recipientType: "customer",
    to,
    subject: `⏰ Tu presupuesto ${d.quoteNumber} caduca pronto`,
    html: T(`<h2 style="font-size:24px;font-weight:800">Tus precios siguen reservados ⏳</h2><p style="color:#555;line-height:1.6">Hola ${d.firstName}, ${urgency}. Hemos mantenido estas condiciones para ti, pero después tendríamos que recalcularlas. Si te encaja, confírmalo y nos ponemos en marcha.</p><div style="background:#FFF4F4;border:1px solid #FBD5D5;border-radius:12px;padding:16px;margin:16px 0;text-align:center"><p style="font-size:13px;color:#888;margin:0 0 4px">${d.quoteNumber}</p><p style="font-size:28px;font-weight:800;color:#DE0121;margin:0">${d.totalPrice}</p><p style="font-size:12px;color:#B91C1C;margin:4px 0 0;font-weight:600">Válido solo hasta el ${d.expiresDate}</p></div><p style="text-align:center"><a href="${d.buyUrl}" class="btn">Confirmar mi pedido</a><br><br><a href="${d.pdfUrl}" class="btn btn-dark">Ver presupuesto (PDF)</a></p><p style="color:#888;font-size:12px;text-align:center;margin-top:16px">¿Necesitas cambiar algo o ampliar el plazo? Responde a este correo y te ayudamos.</p>`, `${d.firstName}, tus precios siguen reservados pero por poco tiempo`) });
}

export async function sendCartAbandonedEmail(to: string, d: { orderId?: number; firstName: string; items: Array<{ name: string; price: string }>; totalPrice: string; cartUrl: string }) {
  const list = d.items.map(i => `<div style="background:#F9F9F9;border-radius:8px;padding:12px;margin-bottom:8px;border:1px solid #E5E7EB;"><strong style="color:#111;font-size:14px;display:block;margin-bottom:4px;">${i.name}</strong><span style="color:#666;font-size:13px;">${i.price}</span></div>`).join("");
  return sendEmail({ emailType: "cart_abandoned", recipientType: "customer", orderId: d.orderId, to, subject: `${d.firstName}, tu configuración te está esperando`, html: T(`<h2 style="font-size:24px;font-weight:800">Lo dejamos todo listo para ti</h2><p style="color:#555;line-height:1.7;margin-bottom:24px;">Hola ${d.firstName}, hemos guardado los productos que estabas configurando con tu marca, para que no tengas que empezar de cero. Retómalo justo donde lo dejaste:</p><div style="margin-bottom:24px;">${list}</div><p style="font-weight:800;font-size:20px;color:#DE0121;text-align:right;margin-bottom:24px;">Importe total: ${d.totalPrice}</p><p style="text-align:center"><a href="${d.cartUrl}" class="btn">Retomar mi configuración</a></p><p style="color:#777;font-size:13px;text-align:center;margin:16px 0 0">¿Dudas con unidades, marcaje o plazos? Responde a este email y te asesoramos sin compromiso.</p>`, `${d.firstName}, guardamos tu configuración lista para que no empieces de cero`) });
}

export async function sendReviewRequestEmail(to: string, d: { orderId?: number; firstName: string; orderNumber: string; couponCode: string; googleReviewUrl: string }) {
  return sendEmail({ emailType: "review_request", recipientType: "customer", orderId: d.orderId, 
    to, 
    subject: "Tu opinión tiene premio: 5% de descuento en Universo Merchan", 
    html: T(`
      <h2 style="font-size:24px;font-weight:800;color:#111;">¡Esperamos que todo haya llegado perfecto!</h2>
      <p style="color:#666;line-height:1.6;font-size:14px;">Hola ${d.firstName},</p>
      <p style="color:#666;line-height:1.6;font-size:14px;">Tu pedido <strong>${d.orderNumber}</strong> debería estar ya en vuestras oficinas haciéndoos disfrutar.</p>
      <p style="color:#666;line-height:1.6;font-size:14px;">Para nosotros, la mayor garantía B2B sois vosotros. Si pudieras tomarte exactamente 30 segundos en valorar positivamente nuestra rapidez y calidad en Google, <strong>te lo recompensaremos automáticamente con este código del 5% de descuento directo</strong> para la próxima campaña corporativa de tu equipo (válido durante todo 1 año).</p>
      
      <div style="background:#F9F9F9;border-radius:12px;padding:24px;margin:24px 0;text-align:center;border:1px dashed #DE0121;">
        <p style="font-size:13px;color:#888;margin:0 0 8px">Tu Código de Descuento Exclusivo (5%)</p>
        <p style="font-size:32px;font-weight:900;color:#111;margin:0;letter-spacing:2px;">${d.couponCode}</p>
      </div>
      
      <p style="text-align:center;margin-top:32px;">
        <a href="${d.googleReviewUrl}" class="btn" style="padding:16px 40px;font-size:16px;">⭐ Valorar en Google</a>
      </p>
    `, "Tu pedido ha sido entregado. Consigue tu cupón de regalo.") 
  });
}

// ── ADMIN EMAILS ─────────────────────────────────────────

export async function notifyAdminNewOrder(d: { orderId?: number; orderNumber: string; clientName: string; clientEmail: string; totalPrice: string; items: Array<{ name: string; quantity: number }>; hasCustomization: boolean }) {
  const list = d.items.map(i => `<li>${i.name} × ${i.quantity}</li>`).join("");
  return sendEmail({ emailType: "admin_new_order", recipientType: "admin", orderId: d.orderId, to: ADMIN_EMAIL, subject: `Nuevo pedido: ${d.orderNumber} — ${d.totalPrice}`, html: T(`<h2>Nuevo pedido</h2><div class="ab" style="background:#DBEAFE"><p style="margin:0"><strong>Pedido:</strong> ${d.orderNumber}</p><p style="margin:4px 0 0"><strong>Cliente:</strong> ${d.clientName} (${d.clientEmail})</p><p style="margin:4px 0 0"><strong>Total:</strong> ${d.totalPrice}</p><p style="margin:4px 0 0"><strong>Tipo:</strong> ${d.hasCustomization ? "CON MARCAJE" : "Sin marcaje"}</p></div><ul style="line-height:2">${list}</ul>`) });
}

export async function notifyAdminNewUser(d: { name: string; email: string; company?: string }) {
  return sendEmail({ emailType: "admin_new_user", recipientType: "admin", to: ADMIN_EMAIL, subject: `Nuevo usuario: ${d.name}`, html: T(`<h2>Nuevo registro</h2><p><strong>Nombre:</strong> ${d.name}</p><p><strong>Email:</strong> ${d.email}</p>${d.company ? `<p><strong>Empresa:</strong> ${d.company}</p>` : ""}`) });
}

export async function notifyAdminProofRejected(d: { orderId?: number; orderNumber: string; clientName: string; productName: string; reason: string }) {
  return sendEmail({ emailType: "admin_proof_rejected", recipientType: "admin", orderId: d.orderId, to: ADMIN_EMAIL, subject: `Proof rechazado: ${d.orderNumber}`, html: T(`<h2>Proof rechazado</h2><div class="ab" style="background:#FEE2E2"><p><strong>Pedido:</strong> ${d.orderNumber}</p><p><strong>Cliente:</strong> ${d.clientName}</p><p><strong>Producto:</strong> ${d.productName}</p><p><strong>Motivo:</strong> ${d.reason}</p></div>`) });
}

export async function notifyAdminOrderError(d: { orderId?: number; orderNumber: string; errorType: string; message: string }) {
  return sendEmail({ emailType: "admin_order_error", recipientType: "admin", orderId: d.orderId, to: "universomerchan7@gmail.com", subject: `Error: ${d.orderNumber}`, html: T(`<h2>Error en pedido</h2><div class="ab" style="background:#FEE2E2"><p><strong>Pedido:</strong> ${d.orderNumber}</p><p><strong>Tipo:</strong> ${d.errorType}</p><p><strong>Detalle:</strong> ${d.message}</p></div>`) });
}

export async function notifyAdminOrderShipped(d: { orderId?: number; orderNumber: string; clientName: string; trackingNumber: string }) {
  return sendEmail({ emailType: "admin_order_completed", recipientType: "admin", orderId: d.orderId, to: ADMIN_EMAIL, subject: `Enviado: ${d.orderNumber}`, html: T(`<h2>Pedido enviado</h2><p><strong>Pedido:</strong> ${d.orderNumber}</p><p><strong>Cliente:</strong> ${d.clientName}</p><p><strong>Tracking:</strong> ${d.trackingNumber}</p>`) });
}

export async function notifyAdminLowStock(d: { productName: string; masterCode: string; sku: string; currentStock: number }) {
  return sendEmail({ emailType: "admin_system_alert", recipientType: "admin", to: ADMIN_EMAIL, subject: `Stock bajo: ${d.productName} (${d.currentStock} uds)`, html: T(`<h2>Stock bajo</h2><div class="ab" style="background:#FEF3C7"><p><strong>Producto:</strong> ${d.productName}</p><p><strong>SKU:</strong> ${d.sku}</p><p><strong>Stock:</strong> ${d.currentStock} uds</p></div>`) });
}

export async function notifyAdminContactForm(d: { name: string; email: string; phone: string; company: string; subject: string; message: string; }) {
  return sendEmail({ emailType: "admin_system_alert", recipientType: "admin", 
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

export async function sendQuizProposalEmail(to: string, packData: any) {
  const productsHtml = packData.products.map((p: any) => `
    <div style="background:#FFFFFF;border-radius:12px;padding:16px;margin:16px 0;border:1px solid #E5E7EB;display:flex;gap:16px;align-items:center;">
      <div style="flex-shrink:0;">
        <img src="${p.image}" alt="${p.name}" style="width:100px;height:100px;object-fit:contain;border-radius:8px;background:#F9F9F9;" />
      </div>
      <div>
        <h3 style="margin:0 0 4px;font-size:16px;">${p.name}</h3>
        <p style="margin:0;font-size:12px;color:#888;">Ref: ${p.masterCode} ${p.price ? `&middot; Desde ${p.price}€/ud` : ""}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#444;font-style:italic;">"${p.justification}"</p>
        <a href="${SITE_URL}${p.url}" style="display:inline-block;margin-top:8px;font-size:12px;color:#DE0121;text-decoration:none;font-weight:bold;">Ver producto →</a>
      </div>
    </div>
  `).join("");

  return sendEmail({ emailType: "quiz_proposal", recipientType: "customer",
    to,
    subject: `Tu propuesta mágica: ${packData.title}`,
    html: T(`
      <h2 style="font-size:24px;font-weight:800;color:#111;">${packData.title}</h2>
      <p style="color:#666;line-height:1.6;font-size:14px;">${packData.intro}</p>
      
      <div style="margin:24px 0;">
        ${productsHtml}
      </div>
      
      <div class="ab" style="background:#F9F9F9;text-align:center;">
        <p style="font-size:15px;color:#111;margin-bottom:16px;"><strong>¿Te encaja esta propuesta?</strong></p>
        <p style="font-size:13px;color:#666;margin-bottom:24px;">${packData.closing}</p>
        <a href="https://wa.me/34614446640" class="btn" style="background-color: #25D366; border-radius: 50px;">Hablar por WhatsApp</a>
      </div>
    `, "Aquí tienes tu pack corporativo recomendado")
  });
}

export async function notifyAdminSystemAlert(d: { subject: string; message: string; alertLevel?: "INFO" | "WARNING" | "CRITICAL" }) {
  let bgColor = "#DBEAFE"; // INFO blue
  if (d.alertLevel === "WARNING") bgColor = "#FEF3C7"; // yellow
  if (d.alertLevel === "CRITICAL") bgColor = "#FEE2E2"; // red
  
  return sendEmail({ emailType: "admin_system_alert", recipientType: "admin",
    to: ADMIN_EMAIL, 
    subject: `[Sistema] ${d.subject}`, 
    html: T(`<h2>Alerta del Sistema</h2>
    <div class="ab" style="background:${bgColor}">
      <p style="margin:0"><strong>Nivel:</strong> ${d.alertLevel || "INFO"}</p>
      <p style="margin:8px 0 0;line-height:1.6">${d.message}</p>
    </div>`) 
  });
}
