const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const queries = `
        UPDATE products SET created_at = NOW() + interval '3 seconds' WHERE master_code = 'MO2485';
        UPDATE products SET created_at = NOW() + interval '2 seconds' WHERE master_code = 'MO6875';
        UPDATE products SET created_at = NOW() + interval '1 second' WHERE master_code = 'KC1447';
        
        UPDATE products SET created_at = NOW() - interval '1 year' WHERE master_code IN ('CX1278', 'CX1360', 'S04447', 'S04448');
    `;
    conn.exec(`sudo -u postgres psql universomerchan -c "${queries}"`, (err, stream) => {
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
