const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const script = `
      cd /var/www/universomerchan
      node -e "
        require('dotenv').config();
        const fetch = require('node-fetch');
        async function run() {
            const res = await fetch('https://api.midocean.com/gateway/printdata/1.0?item=MO6580', {
                headers: { 'x-Gateway-APIKey': process.env.MIDOCEAN_API_KEY }
            });
            const data = await res.json();
            console.log(JSON.stringify(data[0].printing_positions[0], null, 2));
        }
        run().catch(console.error);
      "
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', d => process.stdout.write(d.toString())).stderr.on('data', d => process.stderr.write(d.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
