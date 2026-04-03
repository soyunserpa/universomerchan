const { Client } = require('ssh2');
const fs = require('fs');

const conn = new Client();
conn.on('ready', () => {
    console.log("Connected! Locating Next.js project...");
    
    // First find where the project is
    conn.exec('find / -maxdepth 4 -name "universomerchan" -type d | grep universomerchan/src || echo "NOT FOUND"', (err, stream) => {
        if (err) throw err;
        let data = "";
        stream.on('close', () => {
            let projectDir = data.trim().split('\n')[0];
            if (projectDir.endsWith('/src')) projectDir = projectDir.replace('/src', '');
            
            if (!projectDir || projectDir === "NOT FOUND") {
                console.log("Could not find project dir. Assuming /var/www/universomerchan");
                projectDir = "/var/www/universomerchan";
            }
            
            console.log("Found project at:", projectDir);
            const filesToSync = [
                "src/lib/email-service.ts"
            ];
            
            let uploaded = 0;
            conn.sftp((err, sftp) => {
                if (err) throw err;
                
                filesToSync.forEach(file => {
                    const localPath = `/Users/universomerchan/universomerchanweb/universomerchan/${file}`;
                    const remotePath = `${projectDir}/${file}`;
                    
                    sftp.fastPut(localPath, remotePath, (err) => {
                        if (err) {
                            console.log("Error uploading", localPath, err.message);
                        } else {
                            console.log("Uploaded", localPath, "->", remotePath);
                            uploaded++;
                        }
                        
                        if (uploaded === filesToSync.length) {
                            console.log("Running npm install, build & pm2 reload...");
                            conn.exec(`cd ${projectDir} && mkdir -p src/app/api/cron/generate-blog && npm install && npm run build && pm2 reload all`, (err, buildStream) => {
                                buildStream.on('data', d => process.stdout.write(d))
                                          .on('close', () => conn.end());
                            });
                        }
                    });
                });
            });
        }).on('data', d => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
