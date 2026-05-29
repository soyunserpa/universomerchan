const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT available_techniques::text FROM print_positions WHERE master_code = \'S11500\' LIMIT 1;"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          console.log(data);
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
