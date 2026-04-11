const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('pm2 logs --err --lines 50 --nostream', (err, stream) => {
        stream.on('data', data => process.stdout.write(data)).on('close', () => conn.end());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
