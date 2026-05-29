const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/test-api-fav.js
const fetch = require('node-fetch');
require('dotenv').config();
const { SignJWT } = require('jose');

async function run() {
  const token = await new SignJWT({ userId: 10, email: "marinaberenguervilaverde@gmail.com", role: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET || "universo-merchan-default-secret-change-me"));
    
  const res = await fetch('http://127.0.0.1:3000/api/favorites', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const data = await res.text();
  console.log("STATUS:", res.status);
  console.log("DATA:", data);
}
run();
INNEREOF
cd /var/www/universomerchan && node test-api-fav.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
