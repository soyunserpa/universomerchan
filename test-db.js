const { Client } = require('ssh2'); 
const conn = new Client(); 
conn.on('ready', () => { 
  conn.exec(`sudo -u postgres psql universomerchan -c "SELECT raw_api_data FROM products WHERE master_code = 'MO6327' LIMIT 1;"`, (err, stream) => { 
    stream.on('data', d => process.stdout.write(d)).on('close', () => { setTimeout(() => { process.exit(0); }, 500); });
  }); 
}).connect({host: '212.227.90.110', username: 'root', password: 'V34a6df?6'});
