const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    const cmd = `
    cd /var/www/universomerchan && npx tsx -e "
    import { db } from './src/lib/database';
    import { adminSettings } from './src/lib/schema';
    import { eq } from 'drizzle-orm';
    async function run() {
      const settings = await db.select().from(adminSettings);
      console.log('OLD SETTINGS:', settings);
      
      let foundProd = false;
      let foundPrint = false;
      for (const s of settings) {
        if (s.key === 'margin_product_pct') { foundProd = true; await db.update(adminSettings).set({ value: '40' }).where(eq(adminSettings.key, 'margin_product_pct')); }
        if (s.key === 'margin_print_pct') { foundPrint = true; await db.update(adminSettings).set({ value: '40' }).where(eq(adminSettings.key, 'margin_print_pct')); }
      }
      
      if (!foundProd) await db.insert(adminSettings).values({ key: 'margin_product_pct', value: '40' });
      if (!foundPrint) await db.insert(adminSettings).values({ key: 'margin_print_pct', value: '40' });

      console.log('UPDATED DB MARGINS TO 40.');
      process.exit(0);
    }
    run().catch(console.error);
    "
    `;
    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('Stream :: close :: code: ' + code);
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
