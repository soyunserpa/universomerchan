const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`sudo -u postgres psql universomerchan -c "SELECT id, email_type, recipient_email, delivery_status, sent_at FROM email_log ORDER BY sent_at DESC LIMIT 5;"`, (err, stream) => {
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
    password: 'V34a6df?6'
});
