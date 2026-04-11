const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  
  try {
    await client.connect();
    
    console.log('Truncating search queries...');
    await client.query('TRUNCATE search_queries;');
    
    console.log('Creating CRM Enum...');
    await client.query(`
      DO $$ BEGIN
       CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'LOST');
      EXCEPTION
       WHEN duplicate_object THEN null;
      END $$;
    `);

    console.log('Creating CRM Leads table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "leads" (
        "id" serial PRIMARY KEY NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone" varchar(30),
        "company_name" varchar(200),
        "industry" varchar(100),
        "budget" varchar(100),
        "objective" varchar(200),
        "volume" varchar(50),
        "status" "lead_status" DEFAULT 'NEW' NOT NULL,
        "admin_notes" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log('Creating indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads" USING btree ("email");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");`);
    
    console.log('Migration successful.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
