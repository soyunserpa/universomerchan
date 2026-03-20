// ============================================================
// UNIVERSO MERCHAN — Database Connection
// ============================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Connection pool for the application
const client = postgres(connectionString, {
  max: 20,                    // Max connections in pool
  idle_timeout: 30,           // Close idle connections after 30s
  connect_timeout: 10,        // Timeout for new connections
  prepare: false,             // Disable prepared statements (better for serverless)
});

export const db = drizzle(client, { schema });

// For one-off scripts (migrations, sync)
export function createDirectClient() {
  return postgres(connectionString, { max: 1 });
}
