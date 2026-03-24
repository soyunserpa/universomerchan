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
            const snake = await sql\\\`SELECT position_points, position_id, position_description, master_code FROM print_positions WHERE master_code IN (SELECT master_code FROM products WHERE product_name ILIKE '%SNAKE%')\\\`;
            if (snake.length > 0) {
              console.log('SNAKE DATA FOUND:');
              console.log(JSON.stringify(snake, null, 2));
            } else {
              console.log('SNAKE not found.');
            }
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
