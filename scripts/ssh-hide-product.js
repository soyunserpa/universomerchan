const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`sudo -u postgres psql universomerchan -c "UPDATE products SET is_visible = false WHERE master_code IN ('SOLS08', 'SOLS09', 'SOLS10') RETURNING master_code, is_visible;"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
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
    password: '***REMOVED***'
});
