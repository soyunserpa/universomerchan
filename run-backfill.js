const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to VPS. Forcing synchronization of the Midocean points payload into the database...');
    const script = `
      cd /var/www/universomerchan
      npm run sync:print
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log('Backfill finished. Exit code:', code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: 'V34a6df?6'
});
