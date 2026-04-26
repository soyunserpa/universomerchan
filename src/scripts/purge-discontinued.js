import { Client } from "pg";
import { readFileSync } from "fs";

// Leer la URL de la DB
let envFile = "";
try {
  envFile = readFileSync("/var/www/universomerchan/.env", "utf8");
} catch (e) {
  try { envFile = readFileSync(".env", "utf8"); } catch (e) {}
}

function getEnv(key) { 
    const m = envFile.match(new RegExp(key + '=["\']?([^"\']+\\n?)["\']?')); 
    return m ? m[1].replace("\\n", "\n").trim() : process.env[key]; 
}

const DATABASE_URL = getEnv("DATABASE_URL");

if (!DATABASE_URL) {
    console.error("FATAL: DATABASE_URL not found.");
    process.exit(1);
}

const db = new Client({ connectionString: DATABASE_URL });

async function run() {
    await db.connect();
    
    console.log("[PURGE] Buscando productos fantasma (abandonados por la API de Midocean)...");

    // Buscamos productos que NO hayan actualizado sus precios o stock en los últimos 4 días
    // y que lleven existiendo al menos 4 días (para no borrar recién sincronizados).
    // Usaremos un DELETE CASCADE (Drizzle schema) o un HARD DELETE manual.
    // El esquema de orders (order_lines) preservará la información en modo snapshot.

    const findQuery = `
        SELECT p.id, p.master_code, p.product_name 
        FROM products p
        LEFT JOIN product_prices pp ON p.master_code = pp.master_code
        WHERE p.created_at < NOW() - INTERVAL '4 days'
          AND (pp.last_synced_at IS NULL OR pp.last_synced_at < NOW() - INTERVAL '4 days')
    `;

    const ghostProducts = await db.query(findQuery);

    if (ghostProducts.rows.length === 0) {
        console.log("[PURGE] ✅ Todo limpio. No hay productos fantasma.");
        await db.end();
        process.exit(0);
    }

    console.log(`[PURGE] 🗑️  Encontrados ${ghostProducts.rows.length} productos fantasma. Borrando...`);

    const deletedIds = ghostProducts.rows.map(r => r.id);
    
    // Hard delete. Variants, print_zones, and images will be deleted automatically if CASCADE is setup correctly.
    // Drizzle handles cascade on tables that declare it. Let's force it via SQL natively or just DELETE.
    try {
        const result = await db.query(`DELETE FROM products WHERE id = ANY($1::int[]) RETURNING master_code`, [deletedIds]);
        console.log(`[PURGE] 🚀 ¡Éxito! Obliteraos ${result.rowCount} productos.`);
        
        // Log some of them
        const codes = result.rows.map(r => r.master_code);
        console.log("[PURGE] Códigos eliminados:", codes.slice(0, 50).join(", ") + (codes.length > 50 ? "..." : ""));
        
    } catch (e) {
        console.error("[PURGE] ❌ Error durante el borrado (Posible Foreign Key Constraints):", e.message);
        console.log("[PURGE] Aplicando Fallback: Ocultamiento Suave (isActive = false)...");
        
        await db.query(`UPDATE products SET is_active = false, is_published = false WHERE id = ANY($1::int[])`, [deletedIds]);
        console.log(`[PURGE] 🛡️ Fallback completado. ${deletedIds.length} productos inhabilitados.`);
    }

    await db.end();
}

run();
