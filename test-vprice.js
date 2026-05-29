const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/test-vprice.js
const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const prices = await sql\`SELECT sku, price FROM variant_prices WHERE sku LIKE 'S11380%' LIMIT 5\`;
    console.log(JSON.stringify(prices, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.end();
  }
}
run();
INNEREOF
cd /var/www/universomerchan && node test-vprice.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
