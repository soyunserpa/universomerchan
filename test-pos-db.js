const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://universo:***REMOVED***@localhost:5432/universomerchan' });
client.connect().then(async () => {
  const res = await client.query("SELECT print_positions::text FROM products WHERE master_code = 'S11500'");
  require('fs').writeFileSync('s11500-pos.json', res.rows[0].print_positions);
  console.log("Done");
  client.end();
}).catch(e => console.error(e));
