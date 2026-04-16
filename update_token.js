const { Client } = require('ssh2');
const conn = new Client();
const newToken = "AQXkmnmt-d3xCjrTWl8bSCw8hTMXHXDWvwhviEj7vhclY5mNHK8YJP-sdANpKXWS8OHjyfV-owEgQ0djPX1q-OlLfPLh9QBw9UNCdfGSW4NMNkp_2nqp56SdMwPC66CtKkoORlMpV9uHm1etyiIb-cfQ9F6di70t4SM9FFzt1Xc470xtCUVicRMbEIA2AbrSjcLMJL8mJDsQA1UxwENoYi8v1IpV-tMfeaVNwtBuFr_mUr-8T8dhLsR_JI7aUrckGun9gSvUm2qSJRZnIzNzRC3-YBL900aXh7ZTTFEeCLx1FWLy-Wo-zOuoZcbnjZvqJwIXrFPMJfGdu-AF2vCmg4Obv-KwLA";

conn.on('ready', () => {
    const cmd = `sed -i 's|LINKEDIN_ACCESS_TOKEN=.*|LINKEDIN_ACCESS_TOKEN="${newToken}"|g' /var/www/universomerchan/.env && npm run reload --prefix /var/www/universomerchan`;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
             console.log("Token updated and server restarted");
             conn.end();
        })
        .on('data', data => process.stdout.write(data))
        .stderr.on('data', data => process.stderr.write(data));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
