const { db } = require('./src/lib/database');
const schema = require('./src/lib/schema');
const { eq } = require('drizzle-orm');

async function test() {
    const result = await db.select({
        id: schema.products.masterCode,
        priceScales: schema.productPrices.priceScales,
        imageAssets: schema.products.digitalAssets,
    }).from(schema.products).leftJoin(schema.productPrices, eq(schema.products.masterCode, schema.productPrices.masterCode)).limit(5);

    for (const p of result) {
      let price = "0.00";
      if (p.priceScales) {
          const scales = Array.isArray(p.priceScales) ? p.priceScales : JSON.parse(p.priceScales);
          const sorted = [...scales].sort((a, b) => {
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
          const isImage = (url) => /\.(jpe?g|png|webp|gif|bmp|tiff)$/i.test(url);
          const assets = Array.isArray(p.imageAssets) ? p.imageAssets : JSON.parse(p.imageAssets);
          let validAssets = assets.filter((a) => {
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
