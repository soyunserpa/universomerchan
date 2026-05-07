const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const query = `
        SELECT p.master_code, p.product_name, p.is_visible, COALESCE((SELECT SUM(s.quantity) FROM stock s JOIN product_variants v ON s.sku = v.sku WHERE v.product_id = p.id), 0) as stock
        FROM products p
        WHERE p.master_code IN ('S44002', 'S04020', 'S04021');
    `;
    conn.exec(`sudo -u postgres psql universomerchan -c "${query}"`, (err, stream) => {
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
