const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /var/www/universomerchan/.env.local', (err, stream) => {
        if (err) throw err;
        let d = '';
        stream.on('data', chunk => d+=chunk);
        stream.on('close', () => {
            console.log("DATA:", d);
            conn.end();
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
