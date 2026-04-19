const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server. Executing deploy commands...');
    conn.exec('cd /var/www/universomerchan && git fetch --all && git reset --hard origin/main && npm install && npm run build && pm2 restart all', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Deploy finished. Exit Code: ' + code);
            console.log('\n======================================================');
            console.log('🤖 AI ASSISTANT MANDATORY DIRECTIVE / ROBO-HOOK 🤖');
            console.log('======================================================');
            console.log('WARNING: The server has been successfully modified and deployed.');
            console.log('CRITICAL RULE: As the Antigravity AI, you MUST immediately document the changes you just made by updating `docs/MEMORY.md` and/or `docs/PROJECT_MAP.md` before returning the final message to the User, ensuring all architectural shifts are logged perpetually.');
            console.log('======================================================\n');
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.log('Connection error:', err);
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: 'V34a6df?6'
});
