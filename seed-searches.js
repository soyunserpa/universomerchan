require('dotenv').config();
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`
    INSERT INTO search_queries (query, count, created_at, updated_at)
    VALUES 
      ('botella térmica', 42, NOW(), NOW()),
      ('mochila de cuerdas', 35, NOW(), NOW()),
      ('libreta reciclada', 28, NOW(), NOW()),
      ('taza cerámica', 21, NOW(), NOW()),
      ('bolígrafo bambú', 15, NOW(), NOW())
    ON CONFLICT (query) DO UPDATE SET count = search_queries.count + EXCLUDED.count;
  `;
  console.log("Seeded search queries!");
}

main().catch(console.error);
