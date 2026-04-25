const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connected to server. Executing db query...');
    
    // We echo the script and run it through node
    const script = `
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' }); // Or wherever DB URL is on server
const dbUrl = process.env.DATABASE_URL || "postgres://postgres:S4fcK921m@localhost:5432/universomerchan";
const sql = postgres(dbUrl);

async function run() {
  const email = 'contact@petitateliergraphique.fr';
  const orders = await sql\`SELECT id, "order_status", "total_price", "created_at", "status" FROM orders WHERE "user_id" IN (SELECT id FROM users WHERE email = \${email})\`;
  console.log("--- ORDERS ---");
  console.dir(orders);
  process.exit(0);
}
run();
    `;
    
    conn.exec(`cd /var/www/universomerchan && node -e ${JSON.stringify(script)}`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.log('Connection error:', err);
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: 'V34a6df?6'
});
