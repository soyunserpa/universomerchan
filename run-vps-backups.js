const { Client } = require('ssh2');
const conn = new Client();
console.log("Connecting to VPS...");

conn.on('ready', () => {
    conn.exec('/root/universo-backup.sh && ls -lh /var/backups/universomerchan', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log("Exit code:", code);
            conn.end();
        }).on('data', (d) => process.stdout.write(d))
          .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({
    host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6'
});
