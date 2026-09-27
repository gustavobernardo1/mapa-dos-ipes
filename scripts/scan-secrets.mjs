import { readdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";

const ignoredDirectories = new Set([
  ".git",
  "node_modules",
  ".next",
  ".next-e2e",
  "public/vendor",
  "playwright-report",
  "test-results",
  "coverage",
]);
const findings = [];
function scan(source, label) {
  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    let category;
    if (
      /sb_secret_[A-Za-z0-9_-]{20,}|AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
        line,
      )
    )
      category = "secret/key";
    if (
      /(?:postgres(?:ql)?|https?):\/\/[^\s/:]+:[^\s@]+@/.test(line) &&
      !/(?:YOUR_|SEU_|PASSWORD|password|example|process\.env)/.test(line)
    )
      category = "credential URL";
    for (const token of line.match(
      /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    ) || []) {
      try {
        if (
          JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString())
            .role === "service_role"
        )
          category = "privileged JWT";
      } catch {
        /* Not a valid JWT. */
      }
    }
    if (
      /(?:password|secret|access[_-]?key|token)\s*[=:]\s*["'][^"']{12,}["']/i.test(
        line,
      ) &&
      !/(?:test-only|PRIVATE TEST|process\.env|randomBytes|createHmac|className|type=|Provider|undefined|SUPABASE_|SESSION_|Configure|configure)/.test(
        line,
      )
    )
      category ||= "possible credential (review)";
    if (category)
      findings.push(`${label}:${index + 1} (${category}; value suppressed)`);
  });
}
async function walk(directory = ".") {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name).replaceAll("\\", "/");
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(file) && !ignoredDirectories.has(entry.name))
        await walk(file);
    } else {
      if (/^\.env(?:\.|$)/.test(entry.name) && entry.name !== ".env.example")
        continue; // Authorized private env; Git exclusion is verified below.
      if (
        !/\.(?:ts|tsx|js|mjs|json|md|sql|txt|yml|yaml|toml|ipynb|example|pem|key)$/.test(
          file,
        )
      )
        continue;
      scan(await readFile(file, "utf8"), file);
    }
  }
}
await walk();
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
if (
  tracked.some(
    (file) =>
      /(?:^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example"),
  )
)
  findings.push(
    "Git tracks a private environment file (filename/value suppressed).",
  );
try {
  execFileSync("git", ["check-ignore", ".env.local"], { stdio: "pipe" });
  console.log(".env.local is ignored by Git.");
} catch {
  findings.push(".env.local is not ignored by Git.");
}
const commits = execFileSync("git", ["rev-list", "--all"], {
  encoding: "utf8",
}).trim();
if (commits) {
  const objects = execFileSync("git", ["rev-list", "--objects", "--all"], {
    encoding: "utf8",
  }).split("\n");
  for (const object of objects) {
    const id = object.split(" ")[0];
    if (!id) continue;
    const type = execFileSync("git", ["cat-file", "-t", id], {
      encoding: "utf8",
    }).trim();
    if (type === "blob")
      scan(
        execFileSync("git", ["cat-file", "blob", id], {
          encoding: "utf8",
          maxBuffer: 20 * 1024 * 1024,
        }),
        `Git blob ${id}`,
      );
  }
}
console.log(
  `Scanned workspace sources and Git history; ${tracked.length} tracked files; ${commits ? "history scanned" : "no commits"}.`,
);
if (findings.length) {
  findings.forEach((finding) => console.error(finding));
  process.exitCode = 1;
} else
  console.log(
    "No credential patterns found. This pattern scan cannot prove the absence of every possible secret.",
  );
