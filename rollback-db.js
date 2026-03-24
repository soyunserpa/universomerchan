const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const script = `
      cd /var/www/universomerchan
      node -e "
        require('dotenv').config();
        const postgres = require('postgres');
        async function run() {
            const sql = postgres(process.env.DATABASE_URL);
            console.log('Reverting position_points to NULL for all 8000 rows...');
            await sql\\\`UPDATE print_positions SET position_points = NULL\\\`;
            console.log('Database roll-back complete.');
            process.exit(0);
        }
        run().catch(console.error);
      "
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).connect({
    host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6'
});
