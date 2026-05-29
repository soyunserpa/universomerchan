const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/test-db-favs3.js
const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const favorites = await sql\`
      SELECT 
        uf.id as "favoriteId",
        p.id as "productId",
        p.master_code as "masterCode",
        p.short_description as "shortDescription",
        p.category_level_1 as "categoryLevel1",
        p.slug as "slug",
        p.base_price_sell as "basePriceSell",
        p.min_order_quantity as "minOrderQuantity",
        p.featured_image_url as "featuredImageUrl"
      FROM user_favorites uf
      INNER JOIN products p ON uf.product_id = p.id
      WHERE uf.user_id = 10
    \`;
    console.log("DB FAVORITES:", favorites.length);
    console.log(favorites);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.end();
  }
}
run();
INNEREOF
cd /var/www/universomerchan && node test-db-favs3.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
