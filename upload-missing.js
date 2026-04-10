const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log("Connected. Creating directory and uploading file...");
    
    conn.exec('mkdir -p /var/www/universomerchan/src/app/api/catalog-search', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                if (err) throw err;
                const path = require('path');
                const localPath = '/Users/universomerchan/universomerchanweb/universomerchan/src/app/api/catalog-search/route.ts';
                const remotePath = '/var/www/universomerchan/src/app/api/catalog-search/route.ts';
                sftp.fastPut(localPath, remotePath, (err) => {
                    if (err) console.log("Upload error:", err.message);
                    else console.log("Uploaded successfully.");
                    
                    conn.exec('cd /var/www/universomerchan && npm run build && pm2 reload all', (err, buildStream) => {
                         buildStream.on('data', d => process.stdout.write(d))
                                   .on('stderr', d => process.stderr.write(d))
                                   .on('close', () => conn.end());
                    });
                });
            });
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
