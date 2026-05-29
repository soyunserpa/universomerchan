const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://universo:***REMOVED***@localhost:5432/universomerchan' });
client.connect().then(async () => {
  const vpRows = await client.query("SELECT sku, price, price_scales::text as scales_json FROM variant_prices WHERE master_code = 'S11500' LIMIT 1");
  console.log("Variant row:", vpRows.rows);
  const marginRows = await client.query("SELECT * FROM admin_settings");
  console.log("Admin settings:", marginRows.rows);
  client.end();
}).catch(e => console.error(e));
`;
    conn.exec(`node -e "${script.replace(/"/g, '\\"')}"`, (err, stream) => {
        if (err) throw err;
        let data = '';
        stream.on('close', () => {
          console.log(data);
          conn.end();
        }).on('data', (d) => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
