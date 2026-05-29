const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT technique_id, setup FROM print_prices WHERE technique_id IN (\'ST\', \'ST1\', \'TD\', \'TD1\', \'TR\', \'TT\');"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          console.log(data);
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
