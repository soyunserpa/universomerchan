const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNER_EOF' > /var/www/universomerchan/test_token.js
require('dotenv').config();
console.log(process.env.LINKEDIN_ACCESS_TOKEN);
INNER_EOF
node /var/www/universomerchan/test_token.js`, (err, stream) => {
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
