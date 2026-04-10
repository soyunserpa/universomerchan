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
            
            const path = require('path');
            const rootPath = '/Users/universomerchan/universomerchanweb/universomerchan';
            
            function walkSync(dir) {
                let results = [];
                const absoluteDir = path.resolve(rootPath, dir);
                if (!fs.existsSync(absoluteDir)) return results;
                
                const list = fs.readdirSync(absoluteDir);
                list.forEach(file => {
                    if (['node_modules', '.next', '.git', '.DS_Store'].includes(file)) return;
                    const fullPath = path.resolve(absoluteDir, file);
                    const stat = fs.statSync(fullPath);
                    if (stat && stat.isDirectory()) {
                        results = results.concat(walkSync(path.join(dir, file)));
                    } else {
                        results.push(path.join(dir, file));
                    }
                });
                return results;
            }

            let filesToSync = [
                "tailwind.config.ts",
                "next.config.js",
                "package.json",
                "package-lock.json",
                "postcss.config.js"
            ].filter(f => fs.existsSync(path.resolve(rootPath, f)));

            filesToSync = filesToSync.concat(walkSync('src'));
            filesToSync = filesToSync.concat(walkSync('public'));
            // Remove duplicates just in case
            filesToSync = [...new Set(filesToSync)];

            console.log(`Prepared ${filesToSync.length} files to sync.`);

            const directoriesToCreate = [...new Set(filesToSync.map(f => path.dirname(f).replace(/\\\\/g, '/')))].filter(d => d !== '.');
            const mkdirCommands = directoriesToCreate.map(d => `mkdir -p ${projectDir}/${d}`).join('\\n');
            fs.writeFileSync('mkdir_script.sh', mkdirCommands);

            console.log("Creating remote directories scripts...");
            conn.sftp((err, sftp) => {
                if (err) throw err;
                sftp.fastPut('mkdir_script.sh', `${projectDir}/mkdir_script.sh`, (err) => {
                    if (err) throw err;
                    conn.exec(`cd ${projectDir} && bash mkdir_script.sh && rm mkdir_script.sh`, (err, stream) => {
                        if (err) throw err;
                        let errData = "";
                        stream.on('data', d => {}).on('stderr', d => { errData += d.toString(); }).on('close', () => {
                            if (errData) console.error("MKDIR Warnings:", errData);
                            let uploaded = 0;
                            let failed = 0;
                            
                            function uploadNext(index) {
                                if (index >= filesToSync.length) {
                                    console.log(`Finished uploads. Success: ${uploaded}, Failed: ${failed}`);
                                    console.log("Running npm install, build & pm2 reload...");
                                    conn.exec(`cd ${projectDir} && npm install && npm run build && pm2 reload all`, (err, buildStream) => {
                                        buildStream.on('data', d => process.stdout.write(d))
                                                  .on('stderr', d => process.stderr.write(d))
                                                  .on('close', () => conn.end());
                                    });
                                    return;
                                }
                                
                                const file = filesToSync[index].replace(/\\\\/g, '/');
                                const localPath = `${rootPath}/${file}`;
                                const remotePath = `${projectDir}/${file}`;
                                
                                sftp.fastPut(localPath, remotePath, (err) => {
                                    if (err) {
                                        console.log("Error uploading", file, err.message);
                                        failed++;
                                    } else {
                                        uploaded++;
                                        if (uploaded % 20 === 0) console.log(`Uploaded ${uploaded}/${filesToSync.length}...`);
                                    }
                                    uploadNext(index + 1);
                                });
                            }
                            
                            console.log("Starting file sync...");
                            uploadNext(0);
                        });
                    });
                });
            });
        }).on('data', d => data += d.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
