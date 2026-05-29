const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
    cd /var/www/universomerchan && node -e "
    const { Client } = require('pg');
    const client = new Client({ connectionString: 'postgresql://universo:***REMOVED***@localhost:5432/universomerchan' });
    async function run() {
      await client.connect();
      const res = await client.query(\\"SELECT print_positions FROM products WHERE master_code = 'S11500'\\");
      console.log('S11500 Techniques:');
      const positions = res.rows[0].print_positions;
      for (const pos of positions) {
        console.log('Position:', pos.position_id);
        const techs = typeof pos.available_techniques === 'string' ? JSON.parse(pos.available_techniques) : pos.available_techniques;
        console.log(techs.map(t => t.technique_id || t.id));
      }
      
      const techIds = ['ST', 'ST1', 'S', 'S1', 'S2', 'S3', 'S4'];
      const priceRes = await client.query(\\"SELECT technique_id FROM print_prices WHERE technique_id = ANY(\\$1)\\", [techIds]);
      console.log('Available in print_prices:', priceRes.rows.map(r => r.technique_id));
      
      await client.end();
    }
    run().catch(console.error);
    "
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
