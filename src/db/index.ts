import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "@/lib/env";

import * as schema from "./schema";

/**
 * One pool per process. Next.js hot-reloads modules in development, so the pool
 * is cached on `globalThis` to avoid leaking connections on every edit.
 */
const globalForDb = globalThis as unknown as {
  actionosPool?: Pool;
};

function createPool() {
  return new Pool({
    connectionString: env.DATABASE_URL,
    // Serverless functions get a small pool each; a long-running server can
    // raise this with DATABASE_POOL_MAX.
    max: env.DATABASE_POOL_MAX,
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : undefined,
  });
}

export const pool = globalForDb.actionosPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.actionosPool = pool;
}

export const db = drizzle(pool, { schema });

export type Database = typeof db;
export { schema };
