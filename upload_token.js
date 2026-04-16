const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
const token = fs.readFileSync("/Users/universomerchan/universomerchanweb/universomerchan/Token Linkedin/token-linkedin.txt", "utf8").trim();

conn.on('ready', () => {
    conn.exec(`sed -i "s/^LINKEDIN_ACCESS_TOKEN=.*/LINKEDIN_ACCESS_TOKEN=${token}/g" /var/www/universomerchan/.env && cd /var/www/universomerchan && pm2 reload all`, (err, stream) => {
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
    password: 'V34a6df?6'
});
