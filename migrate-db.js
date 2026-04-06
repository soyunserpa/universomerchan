const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log("Connected! Running DB Migration...");
    // 1. First attempt native psql
    conn.exec('su - postgres -c "psql -d universomerchan -c \\"ALTER TABLE coupons ADD COLUMN free_shipping BOOLEAN DEFAULT false NOT NULL;\\""', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Migration finished with code ' + code);
            // 2. Also try drizzle-kit push just in case
            conn.exec('cd /var/www/universomerchan && npx drizzle-kit db:push', (err2, stream2) => {
                 stream2.on('close', () => conn.end());
                 stream2.on('data', d => process.stdout.write(d));
            });
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
