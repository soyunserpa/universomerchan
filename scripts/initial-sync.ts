// ============================================================
// UNIVERSO MERCHAN — Initial Full Sync Script
// Run: npx tsx scripts/initial-sync.ts
// ============================================================
// This downloads ALL data from Midocean's 5 APIs into your 
// local PostgreSQL. Takes ~5-10 minutes on first run.
// ============================================================

import { runFullSync } from "../src/lib/sync-engine";

async function main() {
  console.log("=".repeat(60));
  console.log("UNIVERSO MERCHAN — Sincronización inicial con Midocean");
  console.log("=".repeat(60));
  console.log("");
  console.log("Esto descargará TODOS los datos de las 5 APIs de Midocean:");
  console.log("  1. Product Information 2.0 (catálogo completo)");
  console.log("  2. Stock Information 2.0 (stock por SKU)");
  console.log("  3. Product Pricelist 2.0 (precios por escalas)");
  console.log("  4. Print Pricelist 2.0 (precios de impresión)");
  console.log("  5. Print Data 1.0 (posiciones y técnicas)");
  console.log("");
  console.log("Tiempo estimado: 5-10 minutos");
  console.log("");

  const startTime = Date.now();
  
  try {
    await runFullSync();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log("");
    console.log(`✅ Sincronización completada en ${duration} segundos`);
    console.log("");
    console.log("Próximos pasos:");
    console.log("  1. npm run dev        → Arranca la tienda en localhost:3000");
    console.log("  2. npm run dev:admin  → Arranca el admin en localhost:3001");
    console.log("");
    
  } catch (error: any) {
    console.error("");
    console.error("❌ Error durante la sincronización:", error.message);
    console.error("");
    console.error("Posibles causas:");
    console.error("  - API Key de Midocean incorrecta o expirada");
    console.error("  - Sin conexión a internet");
    console.error("  - Base de datos no accesible");
    console.error("");
    console.error("Verifica tu .env y vuelve a intentar.");
    process.exit(1);
  }

  process.exit(0);
}

main();
