import { it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { parse, parsePlPgSQL } from "libpg-query";
it("parses the migration and SQL function bodies using the PostgreSQL parser", async () => {
  for (const file of await readdir("supabase/migrations")) {
    const source = await readFile(`supabase/migrations/${file}`, "utf8");
    await expect(parse(source)).resolves.toBeTruthy();
    if (file.includes("cadastro_municipal")) {
      for (const fn of source.matchAll(
        /create(?: or replace)? function[\s\S]*?language sql[\s\S]*?as \$\$([\s\S]*?)\$\$;/g,
      ))
        await expect(parse(fn[1])).resolves.toBeTruthy();
      for (const fn of source.matchAll(
        /create(?: or replace)? function[^;]*?language plpgsql[\s\S]*?\$\$;/g,
      ))
        await expect(
          parsePlPgSQL(
            fn[0]
              .replace("obs public.observacoes", "obs record")
              .replace("point extensions.geography", "point text"),
          ),
        ).resolves.toBeTruthy();
    }
  }
  await expect(
    parse(await readFile("scripts/importacao/prefeitura-import.sql", "utf8")),
  ).resolves.toBeTruthy();
  for (const file of await readdir("supabase/tests")) {
    const sql = await readFile(`supabase/tests/${file}`, "utf8");
    await expect(parse(sql)).resolves.toBeTruthy();
    for (const block of sql.matchAll(/do\s+\$\$([\s\S]*?)\$\$;/gi)) {
      await expect(
        parsePlPgSQL(
          `create function public.test_syntax() returns void language plpgsql as $$${block[1]}$$;`,
        ),
      ).resolves.toBeTruthy();
    }
  }
  const source = await readFile(
    "supabase/migrations/202609260001_mvp.sql",
    "utf8",
  );
  await expect(parse(source)).resolves.toBeTruthy();
  // Outer SQL parsers treat dollar-quoted function bodies as strings.
  const functions = [
    ...source.matchAll(
      /create function[\s\S]*?language sql[\s\S]*?as \$\$([\s\S]*?)\$\$;/g,
    ),
  ];
  expect(functions.length).toBeGreaterThanOrEqual(8);
  for (const fn of functions) await expect(parse(fn[1])).resolves.toBeTruthy();
  const bodies = [
    ...source.matchAll(/create function[^;]*?language plpgsql[\s\S]*?\$\$;/g),
  ];
  expect(bodies).toHaveLength(3);
  // The parser has no catalog: substitute declared custom types, keeping all executable statements.
  for (const fn of bodies) {
    const syntax = fn[0]
      .replace("obs public.observacoes", "obs record")
      .replace("point extensions.geography", "point text");
    await expect(parsePlPgSQL(syntax)).resolves.toBeTruthy();
  }
});
