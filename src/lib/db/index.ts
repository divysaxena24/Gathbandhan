import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern to prevent connection exhaustion across Next.js HMR cycles
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

if (!globalForDb.conn) {
  globalForDb.conn = postgres(connectionString, {
    prepare: false,
    ssl:
      connectionString?.includes("sslmode=require") ||
      connectionString?.includes("neon.tech")
        ? "require"
        : undefined,
    max: 5,
    idle_timeout: 30,
    connect_timeout: 10,
    // Prevent aggressive reconnection attempts during HMR
    max_lifetime: 300,
    onnotice: () => {},
  });
}

export const db = drizzle(globalForDb.conn, { schema });
export type Database = typeof db;

/**
 * Clean logger for database fallback events.
 * Only logs once per context to avoid log spam.
 */
const _warnedContexts = new Set<string>();
export function logDbFallbackWarning(context: string, error: unknown) {
  const errStr = String(
    (error as any)?.cause?.code ||
      (error as any)?.code ||
      (error as any)?.message ||
      error
  );
  if (
    errStr.includes("ECONNREFUSED") ||
    errStr.includes("ENOTFOUND") ||
    errStr.includes("CONNECT_TIMEOUT") ||
    errStr.includes("timeout")
  ) {
    if (!_warnedContexts.has(context)) {
      _warnedContexts.add(context);
      console.warn(`[${context}] Database offline or unreachable (serving fallback data).`);
      // Reset after 30s so it logs again if still failing
      setTimeout(() => _warnedContexts.delete(context), 30000);
    }
  } else {
    console.warn(`[${context}] Database query notice:`, (error as any)?.message || error);
  }
}
