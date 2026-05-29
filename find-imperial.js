const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT master_code, name FROM products WHERE name ILIKE \'%Imperial%\' OR master_code ILIKE \'%11500%\';"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          console.log("Result:", data.trim());
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
