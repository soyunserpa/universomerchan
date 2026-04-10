const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    const dir = '/var/www/universomerchan/src/app/api/cron/check-abandoned-carts';
    conn.exec(`mkdir -p ${dir}`, (err, stream) => {
        stream.on('close', () => {
            conn.sftp((err, sftp) => {
                sftp.fastPut('src/app/api/cron/check-abandoned-carts/route.ts', `${dir}/route.ts`, (err) => {
                    if (err) console.error("Upload error:", err);
                    else console.log("Uploaded successfully");
                    
                    conn.exec(`cd /var/www/universomerchan && npm run build && pm2 reload all`, (err, stream2) => {
                        stream2.on('data', d => process.stdout.write(d));
                        stream2.on('close', () => conn.end());
                    });
                });
            });
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
