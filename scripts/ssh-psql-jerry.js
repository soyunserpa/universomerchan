const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    conn.exec(`sudo -u postgres psql universomerchan -c "SELECT u.id, u.first_name, u.created_at, o.order_number, o.status, o.total_price, (SELECT json_agg(ol.product_name) FROM order_lines ol WHERE ol.order_id = o.id) as products FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.email = 'jerry.zhanay@gmail.com';"`, (err, stream) => {
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
