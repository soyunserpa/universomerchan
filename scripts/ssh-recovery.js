const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // 1. Find process on port 3000 and kill it.
    // 2. Kill all pm2 processes
    // 3. Clear pm2 logs
    // 4. Start again from clean state
    const cmd = `
        fuser -k 3000/tcp || true;
        pm2 stop all || true;
        pm2 delete all || true;
        cd /var/www/universomerchan && npm run build && pm2 start npm --name "universo-tienda" -- start
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
