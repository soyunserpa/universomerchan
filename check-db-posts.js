const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('sudo -u postgres psql -d universomerchan -c "SELECT id, title, published_at FROM blog_posts ORDER BY published_at DESC LIMIT 3;"', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
