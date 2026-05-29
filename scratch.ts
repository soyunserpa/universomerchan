import { db } from './src/lib/database';
import { products } from './src/lib/schema';
import { inArray } from 'drizzle-orm';

async function run() {
  const codes = ['MO2235', 'MO9702', 'MO6752', 'MO6115', 'MO9817', 'MO7263', 'MO6232', 'MO9604', 'MO2624', 'MO6426'];
  const res = await db.query.products.findMany({
    where: inArray(products.masterCode, codes)
  });
  
  res.forEach(p => {
    const assets = p.digitalAssets as any[];
    const img = assets?.find(a => a.type === 'image')?.url || 'No image';
    console.log(`${p.masterCode}: ${img}`);
  });
  process.exit(0);
}

run();
