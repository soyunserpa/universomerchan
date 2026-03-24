import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    const rows = await sql`SELECT id, title, published_at, created_at, updated_at FROM blog_posts ORDER BY id DESC LIMIT 5`;
    console.log("Raw DB Rows:", rows.length);
    for (const row of rows) {
      console.log(`\nRow ${row.id}: ${row.title}`);
      console.log(`published_at:`, row.published_at, `(Type: ${typeof row.published_at})`);
      console.log(`created_at:`, row.created_at, `(Type: ${typeof row.created_at})`);
      console.log(`updated_at:`, row.updated_at, `(Type: ${typeof row.updated_at})`);
      
      try {
        console.log(`Test createdAt map:`, new Date(row.created_at).toISOString());
      } catch(e: any) {
        console.error(`Crash on createdAt:`, e.message);
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
