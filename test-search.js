const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /var/www/universomerchan && npx tsx -e "require(\'dotenv\').config(); import { getProductList } from \'./src/lib/catalog-api\'; async function run() { const list = await getProductList({search: \'S11500\', limit: 1}); console.log(list.products[0].startingPrice); process.exit(0); } run();"', (err, stream) => {
        if (err) throw err;
        let dataStr = '';
        stream.on('close', () => { console.log(dataStr); conn.end(); })
        .on('data', data => dataStr += data.toString())
        .stderr.on('data', data => dataStr += data.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
