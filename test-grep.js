const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('grep -rn "selectedTechnique" /var/www/universomerchan/.next/static/chunks', (err, stream) => {
        if (err) throw err;
        let found = false;
        stream.on('close', () => { 
            if (!found) console.log("Not found in chunks!");
            conn.end(); 
        }).on('data', (data) => {
            found = true;
            process.stdout.write(data.toString().substring(0, 500));
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
