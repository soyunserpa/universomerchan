const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT master_code FROM products;"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          console.log(data.split('\\n').filter(c => c.includes('11500')));
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
