const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/get-colors.js
const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const prices = await sql\`SELECT sku, price FROM variant_prices WHERE master_code = 'S11380'\`;
    const min = Math.min(...prices.map(p => parseFloat(String(p.price).replace(',','.'))));
    const max = Math.max(...prices.map(p => parseFloat(String(p.price).replace(',','.'))));
    console.log("S11380 min/max:", min, max);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.end();
  }
}
run();
INNEREOF
cd /var/www/universomerchan && node get-colors.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
