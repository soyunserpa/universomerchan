const { Client } = require('ssh2');
const fs = require('fs');
const conn = new Client();

const host = '212.227.90.110';
const username = 'root';
const password = '***REMOVED***';

const files = [
  { local: 'src/app/api/admin/orders/[id]/route.ts', remote: '/root/universomerchan/src/app/api/admin/orders/[id]/route.ts' },
  { local: 'src/app/api/admin/orders/[id]/tracking/route.ts', remote: '/root/universomerchan/src/app/api/admin/orders/[id]/tracking/route.ts' },
  { local: 'src/app/admin/orders/[id]/page.tsx', remote: '/root/universomerchan/src/app/admin/orders/[id]/page.tsx' }
];

conn.on('ready', () => {
  console.log('Connected');
  conn.exec('mkdir -p /root/universomerchan/src/app/api/admin/orders/\\[id\\]/tracking', (err, stream) => {
    if (err) throw err;
    stream.on('close', () => {
      conn.sftp((err, sftp) => {
        if (err) throw err;
        let uploaded = 0;
        files.forEach(f => {
          sftp.fastPut(f.local, f.remote, (err) => {
            if (err) throw err;
            console.log('Uploaded', f.local);
            uploaded++;
            if (uploaded === files.length) {
              console.log('Building...');
              conn.exec('cd /root/universomerchan && npm run build && pm2 restart universomerchan', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => conn.end())
                      .on('data', (d) => process.stdout.write(d))
                      .stderr.on('data', (d) => process.stderr.write(d));
              });
            }
          });
        });
      });
    });
  });
}).connect({ host, port: 22, username, password });
