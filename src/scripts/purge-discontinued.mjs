import postgres from "postgres";
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

const sql = postgres(DATABASE_URL);

async function run() {
    console.log("[PURGE] Buscando productos fantasma (abandonados por la API de Midocean)...");

    const ghostProducts = await sql`
        SELECT p.id, p.master_code, p.product_name 
        FROM products p
        LEFT JOIN product_prices pp ON p.master_code = pp.master_code
        WHERE p.created_at < NOW() - INTERVAL '4 days'
          AND (pp.last_synced_at IS NULL OR pp.last_synced_at < NOW() - INTERVAL '4 days')
    `;

    if (ghostProducts.length === 0) {
        console.log("[PURGE] ✅ Todo limpio. No hay productos fantasma.");
        await sql.end();
        process.exit(0);
    }

    console.log(`[PURGE] 🗑️  Encontrados ${ghostProducts.length} productos fantasma. Borrando...`);

    const deletedIds = ghostProducts.map(r => r.id);
    
    try {
        const result = await sql`DELETE FROM products WHERE id = ANY(${deletedIds}::int[]) RETURNING master_code`;
        console.log(`[PURGE] 🚀 ¡Éxito! Obliteraos ${result.length} productos.`);
        
        // Log some of them
        const codes = result.map(r => r.master_code);
        console.log("[PURGE] Códigos eliminados:", codes.slice(0, 50).join(", ") + (codes.length > 50 ? "..." : ""));
        
    } catch (e) {
        console.error("[PURGE] ❌ Error durante el borrado (Posible Foreign Key Constraints):", e.message);
        console.log("[PURGE] Aplicando Fallback: Ocultamiento Suave (isActive = false)...");
        
        await sql`UPDATE products SET is_active = false, is_published = false WHERE id = ANY(${deletedIds}::int[])`;
        console.log(`[PURGE] 🛡️ Fallback completado. ${deletedIds.length} productos inhabilitados.`);
    }

    await sql.end();
}

run();
