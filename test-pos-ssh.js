const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://universo:***REMOVED***@localhost:5432/universomerchan' });
client.connect().then(async () => {
  const res = await client.query("SELECT print_positions::text FROM products WHERE master_code = 'S11500'");
  console.log(res.rows[0].print_positions);
  client.end();
}).catch(e => console.error(e));
`;
    conn.exec(`node -e "${script.replace(/"/g, '\\"')}"`, (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          require('fs').writeFileSync('s11500-pos2.json', data);
          console.log("Written");
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
