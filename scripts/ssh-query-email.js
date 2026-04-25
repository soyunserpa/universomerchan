const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    // Escaping backticks for bash string wrapping
    const script = `
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' }); 
const dbUrl = process.env.DATABASE_URL || "postgres://postgres:S4fcK921m@localhost:5432/universomerchan";
const sql = postgres(dbUrl);

async function run() {
  const result = await sql("SELECT * FROM email_log WHERE email_type = 'cart_abandoned'");
  console.log("--- ABANDONED CART EMAILS LOGGED ---");
  console.log("Total sent:", result.length);
  process.exit(0);
}
run();
    `;
    
    // Instead of command line literal strings, let's write to a file first, then run it.
    conn.exec(`echo ${JSON.stringify(script)} > /tmp/check.js && cd /var/www/universomerchan && node /tmp/check.js`, (err, stream) => {
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
