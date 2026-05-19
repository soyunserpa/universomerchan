const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const jsCode = `
const fs = require('fs');
const https = require('https');
const env = fs.readFileSync('/var/www/universomerchan/.env', 'utf8');
const token = env.split('\\n').find(line => line.startsWith('MIDOCEAN_TOKEN=')).split('=')[1];

const xml = \\\`<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:mid="http://schemas.datacontract.org/2004/07/MidOcean.API.Models">
  <soap:Header>
    <tem:APICredentials>
      <mid:Token>\\\${token}</mid:Token>
    </tem:APICredentials>
  </soap:Header>
  <soap:Body>
    <tem:GetPricesForItem>
      <tem:request>
        <mid:Language>es</mid:Language>
        <mid:ItemCode>MO9401</mid:ItemCode>
      </tem:request>
    </tem:GetPricesForItem>
  </soap:Body>
</soap:Envelope>\\\`;

const options = {
  hostname: 'api.midocean.com',
  port: 443,
  path: '/OrderProcessing.svc',
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml; charset=utf-8',
    'SOAPAction': 'http://tempuri.org/IOrderProcessing/GetPricesForItem'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});

req.write(xml);
req.end();
`;
    conn.exec(`node -e "${jsCode.replace(/"/g, '\\"')}"`, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
