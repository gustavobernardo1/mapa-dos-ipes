import { loadLocalEnv, missing } from "./env.mjs";
loadLocalEnv();
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
  "SESSION_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];
for (const name of required)
  console.log(`${name}: ${missing([name]).length ? "missing" : "present"}`);
console.log(
  `NEXT_PUBLIC_MAPTILER_KEY: ${missing(["NEXT_PUBLIC_MAPTILER_KEY"]).length ? "optional, absent (OSM fallback)" : "present"}`,
);
console.log(
  `Backend: ${process.env.DATA_BACKEND === "supabase" ? "supabase" : "set DATA_BACKEND=supabase for real validation"}`,
);
