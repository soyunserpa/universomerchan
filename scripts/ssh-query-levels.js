const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const query = `
        SELECT category_level1, category_level2, category_level3, COUNT(*) as count 
        FROM products 
        GROUP BY category_level1, category_level2, category_level3 
        ORDER BY count DESC
        LIMIT 20;
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
