const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user_favorites" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    `);
    
    // Check if fk exists before adding
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_favorites_user_id_users_id_fk') THEN
              ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_favorites_product_id_products_id_fk') THEN
              ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
      END $$;
    `);

    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "user_product_idx" ON "user_favorites" ("user_id", "product_id");
    `);

    console.log("user_favorites table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await client.end();
  }
}
run();
