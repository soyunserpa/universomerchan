const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/get-error-db9.js
const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    const res = await sql\`SELECT message, context, created_at FROM error_log WHERE error_type = 'client_exception' ORDER BY created_at DESC LIMIT 2\`;
    res.forEach(r => {
      console.log("AT:", r.created_at, "MSG:", r.message);
      console.log("STACK:", JSON.stringify(r.context).substring(0, 500));
    });
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await sql.end();
  }
}
run();
INNEREOF
cd /var/www/universomerchan && node get-error-db9.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
