const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT print_positions::text FROM products WHERE master_code = \'S11500\';"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          require('fs').writeFileSync('imperial-positions.json', data.trim());
          console.log("Saved to imperial-positions.json locally!");
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
