const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log("Connected to server...");
    conn.exec('cd /var/www/universomerchan && npx drizzle-kit push', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log("Done with exit code", code);
            conn.end();
        }).on('data', (d) => process.stdout.write(d))
          .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
