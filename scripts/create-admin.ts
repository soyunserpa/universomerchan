// ============================================================
// UNIVERSO MERCHAN — Create Admin User Script
// Run: npx tsx scripts/create-admin.ts
// ============================================================

import { db } from "../src/lib/database";
import * as schema from "../src/lib/schema";
import bcrypt from "bcryptjs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("=".repeat(50));
  console.log("UNIVERSO MERCHAN — Crear usuario administrador");
  console.log("=".repeat(50));
  console.log("Este usuario será para admin.universomerchan.com");
  console.log("");

  const email = await ask("Email del admin (default: pedidos@universomerchan.com): ");
  const adminEmail = email || "pedidos@universomerchan.com";
  
  const password = await ask("Contraseña (mínimo 8 caracteres): ");
  if (password.length < 8) {
    console.error("La contraseña debe tener al menos 8 caracteres");
    process.exit(1);
  }

  const firstName = await ask("Nombre: ");
  const lastName = await ask("Apellido: ");

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.insert(schema.users).values({
      email: adminEmail,
      passwordHash,
      role: "admin",
      firstName: firstName || "Admin",
      lastName: lastName || "Universo Merchan",
      companyName: "Universo Merchan",
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Insert default admin settings
    const defaultSettings = [
      { key: "margin_product_pct", value: "40", description: "% margen sobre precio base producto Midocean" },
      { key: "margin_print_pct", value: "50", description: "% margen sobre costes de impresión (setup+print+handling)" },
      { key: "admin_email", value: "pedidos@universomerchan.com", description: "Email para notificaciones admin" },
      { key: "sync_products_interval_hours", value: "6", description: "Intervalo sync productos (horas)" },
      { key: "sync_stock_interval_minutes", value: "30", description: "Intervalo sync stock (minutos)" },
      { key: "low_stock_threshold", value: "100", description: "Umbral para alerta de stock bajo" },
      { key: "quote_validity_days", value: "15", description: "Días de validez de presupuestos" },
      { key: "cart_abandoned_hours", value: "24", description: "Horas para enviar email de carrito abandonado" },
    ];

    for (const setting of defaultSettings) {
      await db.insert(schema.adminSettings)
        .values({ ...setting, updatedAt: new Date() })
        .onConflictDoNothing();
    }

    console.log("");
    console.log("✅ Usuario admin creado correctamente:");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Acceso: https://admin.universomerchan.com`);
    console.log("");
    console.log("✅ Configuración por defecto creada:");
    console.log(`   Margen producto: 40%`);
    console.log(`   Margen marcaje: 50%`);
    console.log("");

  } catch (error: any) {
    if (error.message?.includes("unique")) {
      console.error("Ya existe un usuario con ese email");
    } else {
      console.error("Error:", error.message);
    }
  }

  rl.close();
  process.exit(0);
}

main();
