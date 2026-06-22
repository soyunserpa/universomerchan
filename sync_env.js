const { Client } = require('ssh2');
const conn = new Client();
const fs = require('fs');

const localEnv = fs.readFileSync('.env', 'utf8');

conn.on('ready', () => {
    // Send the local .env to the server
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const writeStream = sftp.createWriteStream('/var/www/universomerchan/.env');
        writeStream.write(localEnv);
        writeStream.end();
        writeStream.on('close', () => {
            console.log('Successfully copied .env to server. Restarting pm2...');
            conn.exec('pm2 restart universo-tienda', (err2, stream) => {
                if (err2) throw err2;
                stream.on('close', () => conn.end());
            });
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
