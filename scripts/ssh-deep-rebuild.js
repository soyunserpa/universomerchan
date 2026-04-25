const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const cmd = `
        pm2 stop all || true;
        pm2 delete all || true;
        sleep 1;
        fuser -k 3000/tcp || true;
        killall node || true;
        sleep 1;
        cd /var/www/universomerchan && rm -rf .next && npm run build && pm2 start npm --name "universo-tienda" -- run start;
        sleep 2;
        pm2 list;
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
            process.exit(0);
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
    password: 'V34a6df?6'
});
