const { Client } = require('ssh2');
const conn = new Client();

const HOST = '212.227.90.110';
const USER = 'root';
const PASS = 'V34a6df?6';
const BACKUP_DIR = '/var/backups/universomerchan';
const APP_DIR = '/var/www/universomerchan';

const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
const DB_FILE = `${BACKUP_DIR}/db_${today}.sql.gz`;
const CODE_FILE = `${BACKUP_DIR}/codigo_${today}.tar.gz`;

// The exact commands to run securely
const COMMANDS = `
  set -e
  echo "🚀 Iniciando Backup Mestro de Universo Merchan..."
  
  # 1. Crear carpeta destino si no existe
  mkdir -p ${BACKUP_DIR}
  
  # 2. Database Backup using PostgreSQL (compressed on the fly)
  echo "📦 Volcando y comprimiendo Base de Datos: universomerchan"
  sudo -u postgres pg_dump universomerchan | gzip > ${DB_FILE}
  
  # 3. Source Code Backup (excluding heavy/temp directories)
  echo "🗂️ Comprimiendo el código fuente (excluyendo basura)..."
  tar --exclude='universomerchan/node_modules' \\
      --exclude='universomerchan/.next' \\
      --exclude='universomerchan/.git' \\
      -czf ${CODE_FILE} -C /var/www universomerchan
  
  # 4. Verify Sizes
  echo "✅ Backups Finalizados. Pesos generados:"
  ls -lh ${BACKUP_DIR} | grep ${today}
  echo "🎉 Todo protegido."
`;

conn.on('ready', () => {
    console.log('[SSH] Connectado al servidor. Ejecutando bóveda de seguridad...');
    conn.exec(COMMANDS, (err, stream) => {
        if (err) throw err;
        
        stream.on('close', (code, signal) => {
            console.log(`\n[SSH] Proceso completado. Code: ${code}`);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect({
    host: HOST,
    port: 22,
    username: USER,
    password: PASS
});
