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
            try {
              const botellas = await sql.unsafe(\\\"SELECT p.master_code, p.product_name, v.color_description FROM products p JOIN product_variants v ON p.id = v.product_id WHERE p.master_code IN ('MO6931', 'MO9800', 'IT3780', 'MO6225')\\\");
              console.table(botellas);
            } catch (e) {
              console.error(e);
            }
            process.exit(0);
        }
        run();
      "
    `;
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
