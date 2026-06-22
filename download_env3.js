const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        sftp.fastGet('/var/www/universomerchan/.env.backup', 'test_env.txt', (err) => {
            conn.end();
            console.log('Downloaded');
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
