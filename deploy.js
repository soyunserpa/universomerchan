const { Client } = require('ssh2');
const conn = new Client();
console.log("Connecting to VPS...");
conn.on('ready', () => {
    console.log("Connected. Pulling and building...");
    conn.exec('cd /var/www/universomerchan && git pull origin main && rm -rf .next && npm run build && pm2 restart all', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log("Deployment complete.");
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: 'V34a6df?6'
});
