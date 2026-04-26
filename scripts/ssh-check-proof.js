const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('cd /var/www/universomerchan && npx tsx --env-file=.env scripts/test-midocean-order.ts', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => { conn.end(); process.exit(0); })
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
