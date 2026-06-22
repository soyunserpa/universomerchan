const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('ls -la /var/www/universomerchan/.env*', (err, stream) => {
        if (err) throw err;
        stream.on('data', chunk => process.stdout.write(chunk));
        stream.on('close', () => conn.end());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
