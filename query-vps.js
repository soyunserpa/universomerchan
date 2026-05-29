const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sudo -u postgres psql -d universomerchan -c "SELECT master_code, product_name FROM products WHERE product_name ILIKE \'%Regent%\' OR product_name ILIKE \'%Imperial%\' OR product_name ILIKE \'%Pioneer%\';"', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
