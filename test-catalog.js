const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/test-catalog.js
const { getProductList } = require('./.next/server/app/api/catalog/route.js'); // Cannot easily require next.js compiled server code outside
// I will just use an API call to localhost:3000/api/catalog?q=S11380
INNEREOF
`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
