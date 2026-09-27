import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { databaseClient } from "./database-client.mjs";
import { loadLocalEnv, missing, safeFailure } from "./env.mjs";

loadLocalEnv();
const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(
    "Provide the administrator email as the only argument. Never supply a password.",
  );
  process.exitCode = 2;
} else if (
  missing([
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "DATABASE_URL",
  ]).length
) {
  console.error(
    "Required Supabase configuration is missing; values suppressed.",
  );
  process.exitCode = 2;
} else {
  let db;
  try {
    db = await databaseClient();
    await db.connect();
    const { rows } = await db.query(
      "select id from auth.users where lower(email)=$1",
      [email],
    );
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    if (rows.length) {
      // Preserve an existing user's password and metadata.
      const current = await client.auth.admin.getUserById(rows[0].id);
      if (current.error || !current.data.user)
        throw new Error("Existing account lookup failed.");
      const promoted = await client.auth.admin.updateUserById(rows[0].id, {
        app_metadata: { ...current.data.user.app_metadata, role: "admin" },
      });
      if (promoted.error || promoted.data.user?.app_metadata.role !== "admin")
        throw new Error("Role update failed.");
      console.log(
        "Existing account granted admin role. Existing password preserved; no credentials printed.",
      );
    } else {
      const password = `${randomBytes(24).toString("base64url")}aA9!`;
      const credentialFile = ".local-data/admin/primeiro-admin.txt";
      await mkdir(".local-data/admin", { recursive: true });
      // Write first so a successful creation never loses the generated password.
      // Refuse to replace any previous credential file.
      await writeFile(
        credentialFile,
        `Conta administrativa do Mapa dos Ipês\nE-mail: ${email}\nSenha: ${password}\n\nArquivo privado, ignorado pelo Git. Guarde em seu gerenciador de senhas e remova este arquivo após salvar.\n`,
        { encoding: "utf8", flag: "wx", mode: 0o600 },
      );
      const created = await client.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "admin" },
      });
      if (created.error || !created.data.user)
        throw new Error(
          "Account creation failed; private credential file retained for inspection.",
        );
      if (created.data.user.app_metadata.role !== "admin")
        throw new Error("Admin role was not assigned.");
      const publicClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } },
      );
      const signedIn = await publicClient.auth.signInWithPassword({
        email,
        password,
      });
      if (signedIn.error || signedIn.data.user?.app_metadata.role !== "admin")
        throw new Error("New admin login verification failed.");
      await publicClient.auth.signOut();
      console.log(
        "Administrator created and Supabase password login verified. No email sent; credentials were not printed.",
      );
      console.log(`Read credentials locally: ${credentialFile}`);
      const base = process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";
      if (["127.0.0.1", "localhost"].includes(new URL(base).hostname)) {
        try {
          const login = await fetch(`${base}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: new URL(base).origin,
            },
            body: JSON.stringify({ email, password }),
          });
          const cookie = login.headers
            .getSetCookie()
            .find((value) => value.startsWith("ipes-admin="))
            ?.split(";")[0];
          if (!login.ok || !cookie)
            throw new Error("Application login failed.");
          const moderation = await fetch(`${base}/api/admin`, {
            headers: { Cookie: cookie },
          });
          if (!moderation.ok)
            throw new Error("Application authorization failed.");
          console.log(
            "Application login and administrative API access verified.",
          );
        } catch {
          console.log(
            "Account created; application access check unavailable. Test /admin locally.",
          );
        }
      }
    }
  } catch (error) {
    safeFailure("Administrator provisioning failed", error);
  } finally {
    await db?.end().catch(() => {});
  }
}
