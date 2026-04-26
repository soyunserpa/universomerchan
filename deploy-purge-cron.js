const { Client } = require('ssh2');
const fs = require('fs');

const scriptContent = fs.readFileSync(__dirname + '/src/scripts/purge-discontinued.mjs', 'utf8');
const base64Script = Buffer.from(scriptContent).toString('base64');

const conn = new Client();
console.log("Connecting to VPS...");

conn.on('ready', () => {
    const cmds = [
        `echo "${base64Script}" | base64 -d > /var/www/universomerchan/src/scripts/purge-discontinued.mjs`,
        `cd /var/www/universomerchan && node src/scripts/purge-discontinued.mjs`, // Execute it once!
        `(crontab -l 2>/dev/null | grep -v "purge-discontinued" ; echo "0 3 1 * * cd /var/www/universomerchan && node src/scripts/purge-discontinued.mjs >> /var/log/universo-purge.log 2>&1") | crontab -`
    ];

    conn.exec(cmds.join(' && '), (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log("Exit code:", code);
            conn.end();
        }).on('data', (d) => process.stdout.write(d))
          .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({
    host: '212.227.90.110', 
    port: 22, 
    username: 'root', 
    password: 'V34a6df?6'
});
