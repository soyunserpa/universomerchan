const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server!');
    conn.exec('cd /var/www/universomerchan/universomerchanweb/universomerchan && git pull origin main && npm run build && pm2 restart universomerchan-web', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Deploy finished. Exit Code: ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.log('Connection error:', err);
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: 'V34a6df?6',
    debug: console.log
});
