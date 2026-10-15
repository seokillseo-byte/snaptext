import { Pool } from "pg";

let pool: Pool | undefined;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for database operations.");
    }

    pool = new Pool({
      connectionString,
      max: Number.parseInt(process.env.DB_POOL_MAX ?? "10", 10),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      application_name: "snaptext-api"
    });
  }

  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    const activePool = pool;
    pool = undefined;
    await activePool.end();
  }
}
