const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec('curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', (err, stream) => {
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
