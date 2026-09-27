import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { loadLocalEnv, missing, safeFailure } from "./env.mjs";
import { databaseClient } from "./database-client.mjs";

loadLocalEnv();
const mode = process.argv[2];
if (!["migrate", "test"].includes(mode))
  throw new Error("Use migrate or test.");
if (missing(["DATABASE_URL"]).length) {
  console.log(
    "DATABASE_URL missing: Supabase > Connect > Direct connection or Session pooler. Store privately in .env.local.",
  );
  process.exitCode = 2;
} else {
  let client;
  try {
    client = await databaseClient();
    client.on("error", (error) =>
      safeFailure("Database connection failed", error),
    );
    await client.connect();
    console.log("Database connection validated (verified TLS).");
    if (mode === "migrate") {
      await client.query("select pg_advisory_lock(71701926)");
      await client.query(
        await readFile(
          "supabase/migrations/202609260000_migration_ledger.sql",
          "utf8",
        ),
      );
      for (const file of (await readdir("supabase/migrations"))
        .filter((f) => /^\d+_[\w-]+\.sql$/.test(f))
        .sort()) {
        const source = await readFile(`supabase/migrations/${file}`, "utf8");
        const version = file.split("_")[0];
        const checksum = createHash("sha256")
          .update(source.replace(/\r\n/g, "\n"))
          .digest("hex");
        const { rows } = await client.query(
          "select checksum from privado.migrations_aplicadas where version=$1",
          [version],
        );
        if (rows.length) {
          if (rows[0].checksum !== checksum)
            throw new Error(
              "Applied migration changed; manual inspection required.",
            );
          console.log(`Already applied: ${file}`);
          continue;
        }
        // Do not adopt or reset an existing schema with no trustworthy migration ledger.
        if (version === "202609260001") {
          const { rows: existing } = await client.query(
            "select to_regclass('public.arvores') as relation",
          );
          if (existing[0].relation)
            throw new Error(
              "Existing schema without ledger: inspect instead of reset.",
            );
        }
        // Keep ledger and DDL in the same transaction. Source migrations are also
        // executable manually, so remove only their outer transaction wrappers.
        const body = source
          .replace(/^begin;\s*$/im, "")
          .replace(/^commit;\s*$/im, "");
        await client.query("begin");
        try {
          await client.query(body);
          await client.query(
            "insert into privado.migrations_aplicadas(version,checksum) values($1,$2)",
            [version, checksum],
          );
          await client.query("commit");
          console.log(`Applied: ${file}`);
        } catch (error) {
          await client.query("rollback");
          throw error;
        }
      }
      await client.query("select pg_advisory_unlock(71701926)");
      await client.query("notify pgrst, 'reload schema'");
    }
    const { rows } = await client.query(
      "select extensions.postgis_version() as version",
    );
    if (!rows[0].version) throw new Error("PostGIS unavailable.");
    console.log("PostGIS validated.");
    if (mode === "test") {
      await client.query(await readFile("supabase/tests/security.sql", "utf8"));
      await client.query(await readFile("supabase/tests/flows.sql", "utf8"));
      console.log(
        "Real SQL checks passed: RLS, Storage policies, spatial queries, transactional moderation and historical association. Fixtures rolled back.",
      );
    }
  } catch (error) {
    safeFailure(
      "Database operation failed; inspect migrations/permissions or connection configuration",
      error,
    );
  } finally {
    if (client)
      await client
        .end()
        .catch((error) => safeFailure("Database close failed", error));
  }
}
