const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT technique_id, pricing_type, setup, var_costs::text as var_costs FROM print_prices WHERE technique_id IN (\'TD\', \'TDT\', \'TT\', \'TR\', \'ST\');"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          require('fs').writeFileSync('techs-debug.json', data);
          console.log("Written");
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
