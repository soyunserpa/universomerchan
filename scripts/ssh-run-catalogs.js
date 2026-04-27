const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const readStream = fs.createReadStream('scripts/remove-catalogs.ts');
        const writeStream = sftp.createWriteStream('/var/www/universomerchan/scripts/remove-catalogs.ts');
        writeStream.on('close', () => {
            conn.exec('cd /var/www/universomerchan && npx tsx --env-file=.env scripts/remove-catalogs.ts', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => { conn.end(); process.exit(0); })
                      .on('data', data => process.stdout.write(data.toString()))
                      .stderr.on('data', data => process.stderr.write(data.toString()));
            });
        });
        readStream.pipe(writeStream);
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
