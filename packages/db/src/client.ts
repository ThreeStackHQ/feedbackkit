import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

// For serverless/edge, use connection pooling
const client = postgres(connectionString, {
  prepare: false, // Required for Supabase/pgBouncer
});

export const db = drizzle(client, { schema });
