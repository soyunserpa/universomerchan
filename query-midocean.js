const { Client } = require('ssh2');
const fs = require('fs');

const code = `
const fetch = require('node-fetch');
async function run() {
  const res = await fetch('https://gateway.midocean.com/customer/1.0/price?company_id=14112&item=S11500', {
    headers: { 'Authorization': 'Bearer YOUR_TOKEN' } // I don't know the token, but there's a script that can do it.
  });
}
`;
