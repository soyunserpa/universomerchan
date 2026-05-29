const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT technique_id, var_costs::text FROM print_prices WHERE technique_id IN (\'TR\');"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          require('fs').writeFileSync('tr-prices.json', data);
          console.log("Written");
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
