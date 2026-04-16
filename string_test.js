const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNER_EOF' > /var/www/universomerchan/test_token2.js
require('dotenv').config();
const t = process.env.LINKEDIN_ACCESS_TOKEN;
if (!t) console.log("Missing");
else console.log(JSON.stringify(t), t.length);
INNER_EOF
cd /var/www/universomerchan && node test_token2.js`, (err, stream) => {
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
