const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('crontab -l | sed \'s/-H Authorization: Bearer ***REMOVED***/-H "Authorization: Bearer ***REMOVED***"/g\' | crontab -', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => {
            console.log('Crontab fixed.');
            conn.end();
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
