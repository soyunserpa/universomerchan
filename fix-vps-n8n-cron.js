const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const commands = `
        # Tumbamos y borramos n8n por ser un fantasma inútil
        docker stop n8n || true
        docker rm n8n || true
        
        # Eliminamos imágenes colgantes si queremos, pero lo evitamos de momento
        # Modificamos el crontab para adelantar el blog 2 horas (de 9 a 7 UTC = 9 AM España)
        crontab -l > /tmp/mycron
        sed -i 's/0 9 \\* \\* \\* curl .*generate-blog/0 7 * * * curl -X POST -H "Authorization: Bearer universomerchancron!123" https:\\/\\/universomerchan.com\\/api\\/cron\\/generate-blog/g' /tmp/mycron
        crontab /tmp/mycron
        rm /tmp/mycron
        
        # Leemos para verificar
        crontab -l
    `;
    conn.exec(commands, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
