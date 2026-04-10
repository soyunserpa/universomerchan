const { Client } = require('ssh2');
const conn = new Client();

const CRON_JOB = '0 * * * * curl -s https://universomerchan.com/api/cron/check-abandoned-carts > /dev/null 2>&1';

conn.on('ready', () => {
    console.log("Connected to server to configure crontab.");
    
    // Check if it already exists
    conn.exec('crontab -l', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('data', (d) => data += d);
        stream.on('close', () => {
            if (data.includes('check-abandoned-carts')) {
                console.log("Cron job already exists.");
                conn.end();
                return;
            }
            
            // Add cron job
            const updatedCrontab = (data + '\n' + CRON_JOB + '\n').trim().replace(/\n+/g, '\n');
            
            // Write to a temporary file and load it
            conn.exec(`echo "${updatedCrontab}" | crontab -`, (err2, stream2) => {
                if (err2) throw err2;
                stream2.on('close', () => {
                    console.log("Successfully installed crontab.");
                    conn.end();
                });
            });
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
