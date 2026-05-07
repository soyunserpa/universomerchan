const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const query = `
        ALTER TABLE leads
        ADD COLUMN utm_source varchar(100),
        ADD COLUMN utm_medium varchar(100),
        ADD COLUMN utm_campaign varchar(200),
        ADD COLUMN referer text;
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
