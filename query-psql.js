const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -c "SELECT technique_id FROM print_prices WHERE technique_id LIKE \'S%\';"', (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end()).on('data', (d) => process.stdout.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
