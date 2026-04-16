const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const newToken = "***REMOVED***";
    
    // update .env inline and preserve quotes
    conn.exec(`sed -i 's/^LINKEDIN_ACCESS_TOKEN=.*/LINKEDIN_ACCESS_TOKEN="${newToken}"/g' /var/www/universomerchan/.env && cd /var/www/universomerchan && pm2 reload all`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
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
    password: '***REMOVED***'
});
