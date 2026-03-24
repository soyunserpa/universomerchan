const { Pool } = require("pg");
require("dotenv").config({ path: ".env" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  try {
    const res = await pool.query("SELECT id, title, published_at, created_at, updated_at FROM blog_posts ORDER BY id DESC LIMIT 5");
    console.log("Raw DB Rows:");
    res.rows.forEach((row, i) => {
      console.log(`\nRow ${i}:`);
      console.log(`id:`, row.id);
      console.log(`title:`, row.title);
      console.log(`published_at:`, row.published_at, `(Type: ${typeof row.published_at}, IsDate: ${row.published_at instanceof Date})`);
      console.log(`created_at:`, row.created_at, `(Type: ${typeof row.created_at}, IsDate: ${row.created_at instanceof Date})`);
      console.log(`updated_at:`, row.updated_at, `(Type: ${typeof row.updated_at}, IsDate: ${row.updated_at instanceof Date})`);
      
      try {
        console.log(`Test createdAt map:`, new Date(row.created_at).toISOString());
      } catch(e) {
        console.error(`Crash on createdAt:`, e.message);
      }
    });
  } catch (e) {
    console.error(e);
  } finally {
    pool.end();
  }
}

run();
