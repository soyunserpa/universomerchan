const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
echo 'CRON_SECRET=merchan_automockup_30_days_v1' >> /var/www/universomerchan/.env
pm2 reload all
(crontab -l 2>/dev/null; echo "0 4 * * * curl -s -X GET https://universomerchan.com/api/cron/clean-mockups -H 'Authorization: Bearer merchan_automockup_30_days_v1' >/dev/null 2>&1") | crontab -
crontab -l
`;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('data', d => console.log(d.toString())).on('close', () => conn.end());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
