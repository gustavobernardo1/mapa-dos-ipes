import pg from "pg";
import { readFile } from "node:fs/promises";
export async function databaseClient() {
  const url = new URL(process.env.DATABASE_URL);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("Invalid database protocol.");
  for (const name of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(name);
  const ca = process.env.DATABASE_SSL_CA_PATH
    ? await readFile(process.env.DATABASE_SSL_CA_PATH, "utf8")
    : undefined;
  return new pg.Client({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
    connectionTimeoutMillis: 15000,
    statement_timeout: 60000,
  });
}
