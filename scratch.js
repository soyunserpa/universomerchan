const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const codes = ['mo2235', 'mo9702', 'mo6752', 'mo6115', 'mo9817', 'mo7263', 'mo6232', 'mo9604', 'mo2624', 'mo6426'];
  
  for (const code of codes) {
    const res = await pool.query("SELECT master_code, digital_assets FROM products WHERE master_code ilike $1", [`%${code}%`]);
    if (res.rows.length > 0) {
      const assets = res.rows[0].digital_assets || [];
      const image = assets.find(a => a.type === 'image' || a.url?.includes('.jpg'))?.url || 'No image';
      console.log(`${res.rows[0].master_code}: ${image}`);
    } else {
      console.log(`${code}: NOT FOUND`);
    }
  }
  pool.end();
}

run();
