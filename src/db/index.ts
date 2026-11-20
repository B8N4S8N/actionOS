import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

/**
 * One pool per process. Next.js hot-reloads modules in development, so the pool
 * is cached on `globalThis` to avoid leaking connections on every edit.
 *
 * The pool is created lazily so `next build` can finish when DATABASE_URL is
 * only a build-time placeholder (see `getEnv`) and never opens a real socket.
 */
const globalForDb = globalThis as unknown as {
  actionosPool?: Pool;
  actionosDb?: Database;
};

function shouldUseSsl(url: string): boolean | { rejectUnauthorized: boolean } {
  if (process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1") {
    return { rejectUnauthorized: true };
  }
  if (process.env.DATABASE_SSL === "false" || process.env.DATABASE_SSL === "0") {
    return false;
  }
  try {
    const host = new URL(url).hostname;
    if (host === "localhost" || host === "127.0.0.1") return false;
  } catch {
    // Fall through — treat as remote.
  }
  return { rejectUnauthorized: true };
}

function createPool() {
  const env = getEnv();
  return new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    ssl: shouldUseSsl(env.DATABASE_URL),
  });
}

function getPool(): Pool {
  if (!globalForDb.actionosPool) {
    globalForDb.actionosPool = createPool();
  }
  return globalForDb.actionosPool;
}

function getDb(): Database {
  if (!globalForDb.actionosDb) {
    globalForDb.actionosDb = drizzle(getPool(), { schema });
  }
  return globalForDb.actionosDb;
}

function bindLazy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, property) {
      const instance = resolve();
      const value = Reflect.get(instance, property, instance);
      return typeof value === "function"
        ? (value as (...args: unknown[]) => unknown).bind(instance)
        : value;
    },
    has(_target, property) {
      return property in (resolve() as object);
    },
  });
}

export const db: Database = bindLazy(getDb);
export const pool: Pool = bindLazy(getPool);

export { schema };
