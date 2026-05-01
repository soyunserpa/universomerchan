const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /var/www/universomerchan && npx tsx -e "require(\'dotenv\').config(); import { getStartingPrice } from \'./src/lib/price-calculator\'; console.log(\'Starting price for 2.01 with 40%:\', getStartingPrice([{costPrice: 2.01, minimumQuantity: 1}], 40));"', (err, stream) => {
        if (err) throw err;
        let dataStr = '';
        stream.on('close', () => { console.log(dataStr); conn.end(); })
        .on('data', data => dataStr += data.toString())
        .stderr.on('data', data => dataStr += data.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
