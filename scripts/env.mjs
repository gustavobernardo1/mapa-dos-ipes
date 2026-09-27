import { existsSync } from "node:fs";
export function loadLocalEnv() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
}
export function missing(names) {
  return names.filter((name) => !process.env[name]?.trim());
}
export function safeFailure(context, error) {
  // Error messages/stacks can contain connection strings, passwords or headers.
  const code =
    typeof error?.code === "string" && /^[A-Z0-9_]{1,32}$/.test(error.code)
      ? ` (${error.code})`
      : "";
  console.error(
    `${context}${code}. Provider details suppressed; credentials were not printed.`,
  );
  process.exitCode = 1;
}
