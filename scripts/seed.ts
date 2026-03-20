// ============================================================
// UNIVERSO MERCHAN — Database Seed Script
// Run: npx tsx scripts/seed.ts
// ============================================================
// Populates the database with:
//   - Default admin settings (margins, sync intervals)
//   - Static pages (About, YourChoice, Legal pages)
//   - Initial blog post (welcome)
// ============================================================

import { db } from "../src/lib/database";
import * as schema from "../src/lib/schema";
import { seedStaticPages, blogPosts } from "../src/lib/cms-content";

async function main() {
  console.log("=".repeat(50));
  console.log("UNIVERSO MERCHAN — Seed Database");
  console.log("=".repeat(50));

  // ── Admin Settings ───────────────────────────────────────
  console.log("\n[Seed] Inserting default admin settings...");
  const defaultSettings = [
    { key: "margin_product_pct", value: "40", description: "% margen sobre precio base producto Midocean" },
    { key: "margin_print_pct", value: "50", description: "% margen sobre costes de impresión (setup+print+handling)" },
    { key: "admin_email", value: "pedidos@universomerchan.com", description: "Email para notificaciones admin" },
    { key: "sync_products_interval_hours", value: "6", description: "Intervalo sync productos (horas)" },
    { key: "sync_stock_interval_minutes", value: "30", description: "Intervalo sync stock (minutos)" },
    { key: "low_stock_threshold", value: "100", description: "Umbral para alerta de stock bajo" },
    { key: "quote_validity_days", value: "15", description: "Días de validez de presupuestos" },
    { key: "cart_abandoned_hours", value: "24", description: "Horas para email carrito abandonado" },
    { key: "whatsapp_phone", value: "614446640", description: "Teléfono WhatsApp" },
    { key: "instagram_url", value: "https://instagram.com/universomerchan", description: "Instagram" },
    { key: "linkedin_url", value: "https://linkedin.com/company/universomerchan", description: "LinkedIn" },
    { key: "contact_email", value: "pedidos@universomerchan.com", description: "Email de contacto público" },
    { key: "contact_phone", value: "+34614446640", description: "Teléfono de contacto" },
  ];

  for (const setting of defaultSettings) {
    try {
      await db.insert(schema.adminSettings)
        .values({ ...setting, updatedAt: new Date() })
        .onConflictDoNothing();
      console.log(`  ✓ ${setting.key} = ${setting.value}`);
    } catch {
      console.log(`  · ${setting.key} (already exists)`);
    }
  }

  // ── Static Pages ─────────────────────────────────────────
  console.log("\n[Seed] Inserting static pages...");
  await seedStaticPages();
  console.log("  ✓ About, YourChoice, Privacy, Cookies, Legal, Terms");

  // ── Welcome Blog Post ────────────────────────────────────
  console.log("\n[Seed] Inserting welcome blog post...");
  try {
    await db.insert(blogPosts).values({
      slug: "bienvenidos-a-universo-merchan",
      title: "Bienvenidos al nuevo Universo Merchan",
      excerpt: "Estrenamos nueva web con más de 4.000 productos personalizables, configurador en tiempo real y entrega en menos de 10 días.",
      body: `<div class="prose">
        <p>Nos emociona presentaros la nueva web de Universo Merchan. Hemos trabajado durante meses para crear la mejor experiencia de compra de merchandising personalizado en España.</p>
        
        <h2>¿Qué hay de nuevo?</h2>
        <p>Nuestra nueva tienda online te permite:</p>
        <ul>
          <li><strong>Explorar más de 4.000 productos</strong> con stock en tiempo real</li>
          <li><strong>Personalizar en 3 pasos</strong>: elige producto, selecciona técnica de impresión, sube tu logo y previsualiza el resultado</li>
          <li><strong>Ver el precio en tiempo real</strong> mientras configuras, sin sorpresas</li>
          <li><strong>Descargar presupuestos PDF</strong> con un clic para compartir con tu equipo</li>
          <li><strong>Aprobar bocetos online</strong> desde tu panel de cliente</li>
          <li><strong>Seguir tu pedido</strong> con tracking en tiempo real</li>
        </ul>
        
        <h2>Nuestra promesa</h2>
        <p>Producción 80% europea, materiales sostenibles, 17 técnicas de impresión y entrega en menos de 10 días. Porque tu marca merece ser recordada.</p>
        
        <p><strong>#GeneraEmociones</strong></p>
      </div>`,
      featuredImageUrl: null,
      isPublished: true,
      publishedAt: new Date(),
      authorName: "Universo Merchan",
      metaTitle: "Bienvenidos al nuevo Universo Merchan | Blog",
      metaDescription: "Estrenamos nueva web con configurador de personalización en tiempo real, +4.000 productos y entrega en menos de 10 días.",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).onConflictDoNothing();
    console.log("  ✓ Welcome blog post created");
  } catch {
    console.log("  · Welcome post (already exists)");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✅ Seed completado");
  console.log("=".repeat(50));
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
