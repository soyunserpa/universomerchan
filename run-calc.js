const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/calc-prices.js
const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL);
  try {
    const codes = ['S11380', 'S01825', 'S11970', 'S03565', 'S03579', 'S03578', 'S11500', 'S11502', 'S11770'];
    const results = [];
    for (const code of codes) {
      const prices = await sql\`SELECT sku, price FROM variant_prices WHERE master_code = \${code}\`;
      if(prices.length > 0) {
        const min = Math.min(...prices.map(p => parseFloat(String(p.price).replace(',','.'))));
        const max = Math.max(...prices.map(p => parseFloat(String(p.price).replace(',','.'))));
        const maxSell = max * 1.4;
        const minSell = min * 1.4;
        const diff = ((max - min) / min) * 100;
        if(diff > 5) {
          results.push(\`\${code}: Variación del \${diff.toFixed(1)}%. Coste base de \${min.toFixed(2)}€ (blanco/claro) hasta \${max.toFixed(2)}€ (colores oscuros). PVP de prenda de \${minSell.toFixed(2)}€ a \${maxSell.toFixed(2)}€.\`);
        }
      }
    }
    console.log(results.join("\\n"));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.end();
  }
}
run();
INNEREOF
cd /var/www/universomerchan && node calc-prices.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
