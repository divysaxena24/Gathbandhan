import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL!;

// Singleton pattern to prevent connection exhaustion and latency during development HMR
const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const client =
  globalForDb.conn ??
  postgres(connectionString, {
    prepare: false,
    ssl:
      connectionString?.includes("sslmode=require") ||
      connectionString?.includes("neon.tech")
        ? "require"
        : undefined,
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.conn = client;
}

export const db = drizzle(client, { schema });
export type Database = typeof db;

/**
 * Clean logger for database fallback events.
 * Formats offline database connection errors as a concise notice.
 */
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
    errStr.includes("CONNECT_TIMEOUT")
  ) {
    console.warn(`[${context}] Database offline or unreachable (serving fallback data).`);
  } else {
    console.warn(`[${context}] Database query notice:`, (error as any)?.message || error);
  }
}
