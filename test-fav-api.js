const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/test-fav.js
const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const favorites = await sql\`
      SELECT 
        user_favorites.id as "favoriteId",
        products.id as "productId"
      FROM user_favorites
      INNER JOIN products ON user_favorites.product_id = products.id
      LIMIT 1
    \`;
    const favoriteProductIds = favorites.map(f => f.productId);
    console.log("MAPPED:", typeof favoriteProductIds, Array.isArray(favoriteProductIds), favoriteProductIds);
  } finally {
    await sql.end();
  }
}
run();
INNEREOF
cd /var/www/universomerchan && node test-fav.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
