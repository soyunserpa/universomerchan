const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log('Connected. Fixing .env');
    
    const command = `node -e "const fs = require('fs'); let env = fs.readFileSync('/var/www/universomerchan/.env', 'utf-8'); env = env.replace(/\\\\nAPPS_SCRIPT_EMAIL_URL.*/g, ''); env = env.replace(/APPS_SCRIPT_EMAIL_URL.*/g, ''); env += '\\nAPPS_SCRIPT_EMAIL_URL=\\"https://script.google.com/macros/s/AKfycby-082Z9RBmOCxLUl8hsxeFvrZJUj1QT1EOHHp0tQ6V3_HUidG4KutHzO2ZeOw6suyi/exec\\"\\n'; fs.writeFileSync('/var/www/universomerchan/.env', env);" && cd /var/www/universomerchan && pm2 restart universo-tienda --update-env`;
    
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Finished with code ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
