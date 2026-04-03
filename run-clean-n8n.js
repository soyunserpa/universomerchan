const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const workflowJson = fs.readFileSync('n8n-clean.json', 'utf8');
const base64Workflow = Buffer.from(workflowJson).toString('base64');

conn.on('ready', () => {
    const script = `
      echo "${base64Workflow}" | base64 -d > /tmp/workflow.json
      docker cp /tmp/workflow.json n8n:/tmp/workflow.json
      docker exec -i n8n n8n import:workflow --input=/tmp/workflow.json
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
