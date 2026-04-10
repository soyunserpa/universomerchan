import { db } from './src/lib/database';
import * as schema from './src/lib/schema';
import { eq } from 'drizzle-orm';

async function test() {
    const result = await db.select({
        id: schema.products.masterCode,
        priceScales: schema.productPrices.priceScales,
        imageAssets: schema.products.digitalAssets,
    }).from(schema.products).leftJoin(schema.productPrices, eq(schema.products.masterCode, schema.productPrices.masterCode)).limit(5);

    let priceDropped = 0, imgDropped = 0, passed = 0;

    for (const p of result) {
      let price = "0.00";
      if (p.priceScales) {
          const scales = Array.isArray(p.priceScales) ? p.priceScales : JSON.parse(p.priceScales as string);
          const sorted = [...scales].sort((a: any, b: any) => {
            const minA = a.minimumQuantity || a.minimum_quantity || 0;
            const minB = b.minimumQuantity || b.minimum_quantity || 0;
            return minB - minA;
          });
          if (sorted[0]) {
            const cheapest = sorted[0].price || sorted[0].costPrice || 0;
            price = (Math.round(cheapest * 1.40 * 100) / 100).toFixed(2);
          }
      }
      
      let img = "";
      if (p.imageAssets) {
          const isImage = (url: string) => /\.(jpe?g|png|webp|gif|bmp|tiff)$/i.test(url);
          const assets = Array.isArray(p.imageAssets) ? p.imageAssets : JSON.parse(p.imageAssets as string);
          let validAssets = assets.filter((a: any) => {
             const u = a.url_highress || a.url_highres || a.url || "";
             return isImage(u);
          });
          if (validAssets.length > 0) {
              img = validAssets[0].url_highress || validAssets[0].url_highres || validAssets[0].url;
          }
          console.log(p.id, "Valid assets?", validAssets.length, "Original assets:", assets.length, "URL:", assets[0]?.url);
      }
      
      console.log("Product:", p.id, "| Price:", price, "| Img:", !!img);
    }
    process.exit(0);
}
test();
