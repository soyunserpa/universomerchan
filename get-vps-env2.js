const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cat /var/www/universomerchan/.env | grep -i n8n', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
