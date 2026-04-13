import postgres from 'postgres';
import { readFileSync } from 'fs';

// Helper to get environment variables locally
function getEnv(key: string) { 
  try {
    const envFile = readFileSync('.env', 'utf8');
    const m = envFile.match(new RegExp(key + '=["\']?([^"\']+\\n)["\']?')); 
    if (m && m[1]) return m[1].trim();
  } catch (e) {
    // fallback to process.env
  }
  return process.env[key] || null; 
}

const dbUrl = getEnv('DATABASE_URL');
const apiKey = getEnv('MIDOCEAN_API_KEY');

if (!dbUrl || !apiKey) {
  console.error('[Cleanup] Missing DATABASE_URL or MIDOCEAN_API_KEY environment variables.');
  process.exit(1);
}

const sql = postgres(dbUrl);

async function runCleanup() {
  console.log('[Cleanup] Inicio de rutina de limpieza de productos descatalogados...');
  
  try {
    // 1. Descargamos el último listado OFICIAL maestro de Midocean
    console.log('[Cleanup] Descargando inventario maestro de Midocean API...');
    const res = await fetch('https://api.midocean.com/gateway/pricelist/2.0', { 
      headers: { 'x-Gateway-APIKey': apiKey as string } 
    });
    
    if (!res.ok) { 
      throw new Error(`[Cleanup] Error API Midocean. HTTP ${res.status}`);
    }
    
    const data = await res.json();
    const skuPrices = data.price || [];
    
    // 2. Extraer todos los master_codes únicos devueltos por la API (que Midocean considera vivos)
    const activeMasterCodesFromMidocean = new Set<string>();
    
    for (const entry of skuPrices) {
      const sku = entry.sku || "";
      const price = parseFloat(entry.price?.replace(/\./g, "").replace(",", ".") || "0");
      if (isNaN(price) || price <= 0) continue; // Ignoramos si el precio viene roto, porque no se considera activo real
      
      const parts = sku.split("-");
      const masterCode = parts[0]; 
      if (masterCode) {
        activeMasterCodesFromMidocean.add(masterCode.toUpperCase());
      }
    }
    
    console.log(`[Cleanup] Midocean reporta ${activeMasterCodesFromMidocean.size} productos Maestro activos.`);
    
    // 3. SEGURIDAD ANTI-DESTRUCCIÓN 
    // Si Midocean devuelve menos de 2000 productos MAESTROS, es muy probable que su API haya tenido
    // un fallo temporal, haya devuelto un JSON parcial o truncado. Abortamos para no vaciar la BD entera.
    if (activeMasterCodesFromMidocean.size < 2000) {
       console.error(`[Cleanup] ❌ PELIGRO: La API de Midocean sólo devolvió ${activeMasterCodesFromMidocean.size} artículos válidos. Esto indica un fallo de servidor por parte de Midocean. ABORTANDO BORRADO MASIVO.`);
       await sql.end();
       process.exit(1);
    }
    
    console.log(`[Cleanup] ✅ Check de seguridad de volumen superado. Calculando discrepancias...`);
    
    // 4. Buscar nuestros productos en base de datos
    const myProducts = await sql`SELECT master_code FROM products`;
    const localMasterCodes = myProducts.map(p => p.master_code.toUpperCase());
    
    console.log(`[Cleanup] Universo Merchan base de datos tiene actualmente: ${localMasterCodes.length} productos Maestro.`);
    
    // 5. Comparar: ¿Cuales tengo locales que NO estén en la lista Midocean actualizada?
    const codesToDelete = localMasterCodes.filter(localCode => !activeMasterCodesFromMidocean.has(localCode));
    
    if (codesToDelete.length === 0) {
       console.log(`[Cleanup] Catálogo impecable. No se ha detectado ningún producto Midocean descatalogado. Saliendo.`);
    } else {
       console.log(`[Cleanup] 🗑️ ALERTA: Se han detectado ${codesToDelete.length} productos fantasmas descatalogados por Midocean.`);
       console.log(`[Cleanup] Códigos a eliminar: ${codesToDelete.slice(0, 10).join(', ')}${codesToDelete.length > 10 ? '...' : ''}`);
       
       // El ORM cascade se encargará de borrar las tablas de variantes (product_variants) etc, 
       // porque en el Schema tienen onDelete: "cascade" a esta ID.
       // Los pedidos antiguos NO fallarán, porque hemos sido inteligentes y la tabla orderLines no depende
       // estrictamente con una Foriegn Key rígida del product.id
       
       // Borramos en lotes si hay muchos (por si a caso)
       const result = await sql`DELETE FROM products WHERE master_code IN ${sql(codesToDelete)}`;
       console.log(`[Cleanup] ✅ Purga completada. Identidad de registros borrados limpiamente: ${result.count}.`);
    }

  } catch (error) {
    console.error('[Cleanup] ❌ Fallo catastrófico en script:', error);
  } finally {
    await sql.end();
    console.log('[Cleanup] Cierre exitoso de conexiones Postgres.');
  }
}

runCleanup();
