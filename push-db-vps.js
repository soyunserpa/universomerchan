const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Running DB migration on VPS.');
    conn.exec('cd /var/www/universomerchan && git fetch --all && git pull && npm run build && npx drizzle-kit push && pm2 reload all --update-env', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Finished with code ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
