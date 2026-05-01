const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /var/www/universomerchan && source .env && npx tsx -e "require(\'dotenv\').config(); import { getProductDetail } from \'./src/lib/catalog-api\'; async function run() { const p = await getProductDetail(\'S11500\'); console.log(JSON.stringify((p as any).variantPrices[\'S11500-FR-L\'], null, 2)); process.exit(0); } run();"', (err, stream) => {
        if (err) throw err;
        let dataStr = '';
        stream.on('close', () => { console.log(dataStr); conn.end(); })
        .on('data', data => dataStr += data.toString())
        .stderr.on('data', data => dataStr += data.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
