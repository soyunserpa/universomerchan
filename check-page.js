const { Client } = require('ssh2');

const script = `
cat /var/www/universomerchan/src/app/page.tsx | grep "MO20"
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        let out = "";
        stream.on('close', () => {
            console.log("On Linux:", out);
            conn.end();
        }).on('data', data => out += data.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
