const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const query = `
      UPDATE order_lines 
      SET proof_status = 'approved', proof_approved_at = NOW()
      WHERE order_id = (SELECT id FROM orders WHERE order_number = 'UM-2026-0073')
      AND proof_status = 'waiting_approval';
      
      UPDATE orders
      SET status = 'proof_approved'
      WHERE order_number = 'UM-2026-0073';
    `;
    conn.exec(`sudo -u postgres psql -d universomerchan -c "${query.replace(/\n/g, ' ')}"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
