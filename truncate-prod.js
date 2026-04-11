const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function truncate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    await client.query('TRUNCATE search_queries;');
    console.log('Truncation successful.');
  } catch (err) {
    console.error('Truncation failed:', err);
  } finally {
    await client.end();
  }
}

truncate();
