const { neon } = require('@neondatabase/serverless');
const sql = neon("postgresql://neondb_owner:F1rM8cAhxLbs@ep-blue-sea-a2rww68i-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require");
async function main() {
try {
  await sql`SELECT * FROM search_queries LIMIT 1`;
  console.log("Table exists");
} catch(e) {
  console.error("Error:", e.message);
}
}
main();
