const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const script = `
      cd /var/www/universomerchan
      node -e "
        require('dotenv').config();
        const postgres = require('postgres');
        const sql = postgres(process.env.DATABASE_URL);
        async function run() {
            const acawai = await sql\\\`SELECT position_points, print_position_image, position_image_blank, position_id FROM print_positions WHERE master_code = 'MO2184'\\\`;
            console.log(JSON.stringify(acawai, null, 2));
            process.exit(0);
        }
        run().catch(console.error);
      "
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
