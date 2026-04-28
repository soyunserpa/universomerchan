const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /var/www/universomerchan && npx tsx -e "import { getOrderDetails } from \'../src/lib/midocean-api\'; async function run() { console.log(JSON.stringify(await getOrderDetails(\'3778530\'), null, 2)); } run();"', (err, stream) => {
        if (err) throw err;
        let dataStr = '';
        stream.on('close', () => { console.log(dataStr); conn.end(); })
        .on('data', data => dataStr += data.toString())
        .stderr.on('data', data => dataStr += data.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
