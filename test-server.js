const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('free -m && echo "---" && df -h / && echo "---" && uptime && echo "---" && top -b -n 1 | head -n 10 && echo "---" && pm2 status', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.end();
        }).on('data', (data) => {
            console.log(data.toString());
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
