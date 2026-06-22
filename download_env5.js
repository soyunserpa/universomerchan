const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /var/www/universomerchan/.env.backup', (err, stream) => {
        if (err) throw err;
        let d = ''; let e = '';
        stream.on('data', chunk => d+=chunk);
        stream.stderr.on('data', chunk => e+=chunk);
        stream.on('close', () => {
            console.log("DATA:", d);
            console.log("ERR:", e);
            conn.end();
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
