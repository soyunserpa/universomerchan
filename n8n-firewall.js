const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
      ufw status || iptables -L -n | grep 5678
      ls -la /etc/nginx/sites-enabled/ 2>/dev/null
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
