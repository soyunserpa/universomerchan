const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const script = `
      curl -s http://localhost:5678/api/v1/workflows || echo "API not active"
      # Try the internal REST API for the GUI directly
      curl -X POST http://localhost:5678/rest/workflows \
        -H "Accept: application/json, text/plain, */*" \
        -H "Content-Type: application/json" \
        -d @/tmp/workflow.json
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
