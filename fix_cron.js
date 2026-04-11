const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('mkdir -p /var/log/universomerchan && curl -I -X POST -H "Authorization: Bearer universomerchancron!123" https://universomerchan.com/api/cron/generate-blog', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
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
