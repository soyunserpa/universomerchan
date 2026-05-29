const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec('psql "postgresql://universo:***REMOVED***@localhost:5432/universomerchan" -A -t -c "SELECT print_positions::text FROM products WHERE master_code = \'S11500\';"', (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          const positions = JSON.parse(data);
          positions.forEach(p => console.log(p.position_id, p.max_print_width, p.max_print_height));
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
