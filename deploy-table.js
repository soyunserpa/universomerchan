const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
    console.log("Connected to server...");
    conn.exec(`cat << 'INNEREOF' > /var/www/universomerchan/create-table.js
const postgres = require('postgres');
require('dotenv').config();

async function run() {
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    await sql\`
      CREATE TABLE IF NOT EXISTS "user_favorites" (
        "id" serial PRIMARY KEY NOT NULL,
        "user_id" integer NOT NULL,
        "product_id" integer NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL
      );
    \`;
    
    await sql\`
      DO \\$\\$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_favorites_user_id_users_id_fk') THEN
              ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
      END \\$\\$;
    \`;

    await sql\`
      DO \\$\\$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_favorites_product_id_products_id_fk') THEN
              ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
      END \\$\\$;
    \`;

    await sql\`
      CREATE UNIQUE INDEX IF NOT EXISTS "user_product_idx" ON "user_favorites" ("user_id", "product_id");
    \`;

    console.log("user_favorites table created successfully!");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await sql.end();
  }
}
run();
INNEREOF
cd /var/www/universomerchan && node create-table.js`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log("Done with exit code", code);
            conn.end();
        }).on('data', (d) => process.stdout.write(d))
          .stderr.on('data', (d) => process.stderr.write(d));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: '***REMOVED***' });
