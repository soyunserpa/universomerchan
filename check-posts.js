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
              const rows = await sql.unsafe('SELECT id, title, is_published, published_at, created_at, updated_at FROM blog_posts ORDER BY id DESC LIMIT 5');
              console.log('Total Rows:', rows.length);
              rows.forEach(r => {
                console.log('--- Row', r.id, '---');
                console.log('is_published:', r.is_published);
                console.log('published_at:', r.published_at, typeof r.published_at, r.published_at instanceof Date ? 'isDate' : '');
                console.log('created_at:', r.created_at, typeof r.created_at, r.created_at instanceof Date ? 'isDate' : '');
                console.log('updated_at:', r.updated_at, typeof r.updated_at, r.updated_at instanceof Date ? 'isDate' : '');
              });
            } catch (e) {
              console.error('DB ERROR', e);
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
