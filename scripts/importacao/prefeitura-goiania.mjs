import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";
import { loadLocalEnv, safeFailure } from "../env.mjs";
import { databaseClient } from "../database-client.mjs";
import {
  SOURCE,
  CODES,
  EXPECTED,
  sha,
  assemble,
  planRows,
  verifyRows,
} from "./prefeitura-core.mjs";
const dir = resolve(".local-data/importacao-prefeitura");
const endpoint =
  "https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer/3/query";
const args = process.argv.slice(2),
  mode = args[0] || "--plan";
assert(
  ["--prepare", "--plan", "--apply"].includes(mode),
  "Use --prepare, --plan ou --apply.",
);
let client,
  lastRequest = 0;
const json = async (file) => JSON.parse(await readFile(file, "utf8"));
const save = async (file, value) =>
  writeFile(`${dir}/${file}`, JSON.stringify(value, null, 2) + "\n", "utf8");
async function querySource(tag, params) {
  for (let attempt = 0; attempt < 3; attempt++) {
    await new Promise((r) =>
      setTimeout(r, Math.max(0, 500 - (Date.now() - lastRequest))),
    );
    lastRequest = Date.now();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: new URLSearchParams({ ...params, f: "json" }),
        signal: AbortSignal.timeout(45000),
      });
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      const text = await response.text();
      await writeFile(`${dir}/raw/${tag}.json`, text);
      const result = JSON.parse(text);
      if (result.error) throw new Error("ArcGIS não completou a consulta.");
      await save(`raw/${tag}.consulta.json`, {
        url: endpoint,
        params,
        consultado_em: new Date().toISOString(),
        sha256: sha(text),
      });
      return result;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
}
async function prepare() {
  const summary = await json("data/prefeitura/ipes_resumo.json");
  assert.deepEqual(
    summary.por_codigo.map((r) => r.codigo),
    CODES,
  );
  assert.equal(summary.total_possiveis_ipes, 1914);
  for (const cat of summary.por_codigo)
    assert.equal(cat.quantidade, EXPECTED[cat.codigo]);
  const where = `cdespecie IN (${CODES.join(",")})`;
  const before = await querySource("contagem_inicial", {
    where,
    returnCountOnly: "true",
  });
  assert.equal(
    before.count,
    1914,
    "Fonte mudou: não alterar o lote aprovado automaticamente.",
  );
  const features = { 31982: [], 4326: [] };
  const started = new Date().toISOString();
  for (const sr of [31982, 4326])
    for (let offset = 0; offset < 1914; offset += 500) {
      const page = await querySource(`arvores_${sr}_${offset}`, {
        where,
        outFields: sr === 31982 ? "*" : "OBJECTID",
        returnGeometry: "true",
        outSR: String(sr),
        orderByFields: "OBJECTID",
        resultOffset: String(offset),
        resultRecordCount: "500",
      });
      assert.equal(page.spatialReference?.wkid, sr);
      assert(page.features.length > 0 && page.features.length <= 500);
      features[sr].push(...page.features);
    }
  const after = await querySource("contagem_final", {
    where,
    returnCountOnly: "true",
  });
  assert.equal(after.count, 1914);
  const rows = assemble(
    features[31982],
    features[4326],
    summary.por_codigo,
    started,
  );
  const snapshot = {
    fonte: SOURCE,
    query: endpoint,
    where,
    codigos: CODES,
    contagens: EXPECTED,
    consultado_em: started,
    relatorio_sha256: sha(
      await readFile("data/prefeitura/ipes_resumo.json", "utf8"),
    ),
    rows,
  };
  snapshot.hash_lote = sha(rows);
  await save("snapshot.json", snapshot);
  console.log(
    JSON.stringify(
      {
        preparados: rows.length,
        hash_lote: snapshot.hash_lote,
        arquivo: ".local-data/importacao-prefeitura/snapshot.json",
        gravacoes_no_banco: 0,
      },
      null,
      2,
    ),
  );
}
async function inspect(snapshot) {
  const { rows: existing } = await client.query(
    "select id,codigo_publico,status,extensions.st_y(localizacao::extensions.geometry) latitude,extensions.st_x(localizacao::extensions.geometry) longitude,to_jsonb(a)->'origem_municipal' origem_municipal,to_jsonb(a)->'status_verificacao_comunitaria' verificacao,atualizado_em from public.arvores a order by id",
  );
  const { rows: table } = await client.query(
    "select to_regclass('privado.cadastros_municipais') relation",
  );
  const origins = table[0].relation
    ? (
        await client.query(
          "select objectid,arvore_id,hash_payload from privado.cadastros_municipais where fonte=$1 and dataset=$2 and layer=$3 order by objectid",
          [SOURCE.fonte, SOURCE.dataset, SOURCE.layer],
        )
      ).rows
    : [];
  const boundary = await json("data/prefeitura/limite_goiania.geojson");
  const counts = planRows(
    snapshot.rows,
    existing,
    origins,
    boundary.features[0].geometry.coordinates,
  );
  const migration = await readFile(
    "supabase/migrations/202609260003_cadastro_municipal.sql",
    "utf8",
  );
  const checksum = sha(migration.replace(/\r\n/g, "\n"));
  const { rows: applied } = await client.query(
    "select checksum from privado.migrations_aplicadas where version='202609260003'",
  );
  if (applied.length)
    assert.equal(
      applied[0].checksum,
      checksum,
      "Migration aplicada diverge do arquivo.",
    );
  assert.equal(
    Boolean(table[0].relation),
    Boolean(applied.length),
    "Schema/ledger inconsistente: interromper.",
  );
  const plan = {
    ...counts,
    hash_lote: snapshot.hash_lote,
    migration_sha256: checksum,
    migration_pendente: !applied.length,
    estado_banco_sha256: sha({ existing, origins }),
    arvores_existentes: existing.length,
    inserts_por_tabela: {
      arvores: counts.inserts,
      cadastros_municipais: counts.inserts,
      cadastros_municipais_versoes: counts.inserts + counts.updates,
    },
    updates_por_tabela: {
      arvores: counts.updates,
      cadastros_municipais: counts.updates,
    },
    pares_municipais_ate_2m: counts.pares_municipais_ate_10m.filter(
      (p) => p.distancia_m <= 2,
    ).length,
    pares_coordenadas_identicas: counts.pares_municipais_ate_10m.filter(
      (p) => p.coordenadas_identicas,
    ).length,
    codigo_importador_sha256: sha(
      (
        await Promise.all(
          [
            "scripts/importacao/prefeitura-goiania.mjs",
            "scripts/importacao/prefeitura-core.mjs",
            "scripts/importacao/prefeitura-import.sql",
          ].map((file) => readFile(file, "utf8")),
        )
      ).join("\n"),
    ),
  };
  return { ...plan, hash_plano: sha(plan) };
}
async function apply(snapshot, approved) {
  // A aprovação é vinculada a este snapshot, migration e estado do banco.
  await client.query("begin isolation level serializable");
  try {
    await client.query("select pg_advisory_xact_lock(71701926)");
    const current = await inspect(snapshot);
    if (
      current.inserts === 0 &&
      current.updates === 0 &&
      current.sem_alteracao === 1914 &&
      !current.migration_pendente &&
      current.conflitos_bloqueantes.length === 0 &&
      current.hash_lote === approved.hash_lote &&
      current.migration_sha256 === approved.migration_sha256 &&
      current.codigo_importador_sha256 === approved.codigo_importador_sha256
    ) {
      await client.query("rollback");
      await save("resultado.json", {
        ...current,
        executado_em: new Date().toISOString(),
        idempotente: true,
        gravacoes_no_banco: 0,
      });
      console.log(
        "Lote já importado com o mesmo conteúdo: 0 inserts, 0 updates; histórico preservado.",
      );
      return;
    }
    assert.equal(
      current.hash_plano,
      approved.hash_plano,
      "Plano mudou: refazer simulação e obter nova aprovação.",
    );
    assert.equal(
      current.conflitos_bloqueantes.length,
      0,
      "Conflitos bloqueantes precisam de revisão.",
    );
    if (current.migration_pendente) {
      const body = (
        await readFile(
          "supabase/migrations/202609260003_cadastro_municipal.sql",
          "utf8",
        )
      )
        .replace(/^begin;\s*$/im, "")
        .replace(/^commit;\s*$/im, "");
      await client.query(body);
      await client.query(
        "insert into privado.migrations_aplicadas(version,checksum) values('202609260003',$1)",
        [current.migration_sha256],
      );
    }
    await client.query("lock table public.arvores in share row exclusive mode");
    const before = (
      await client.query(
        "select (select count(*) from public.observacoes) observations,(select count(*) from public.fotos) photos",
      )
    ).rows[0];
    await client.query(
      await readFile("scripts/importacao/prefeitura-import.sql", "utf8"),
      [JSON.stringify(snapshot.rows)],
    );
    const checks = (
      await client.query(
        "select count(*) total,count(*) filter(where a.status='PENDENTE' and a.status_verificacao_comunitaria='NAO_VERIFICADA') unverified from privado.cadastros_municipais c join public.arvores a on a.id=c.arvore_id where c.objectid=any($1::bigint[]) and c.fonte=$2 and c.dataset=$3 and c.layer=$4 and a.status_validacao='CADASTRO_PUBLICO'",
        [
          snapshot.rows.map((r) => r.objectid),
          SOURCE.fonte,
          SOURCE.dataset,
          SOURCE.layer,
        ],
      )
    ).rows[0];
    assert.equal(+checks.total, 1914);
    if (current.inserts === 1914)
      assert.equal(
        +checks.unverified,
        1914,
        "A importação inicial deve deixar todas as árvores sem verificação.",
      );
    const after = (
      await client.query(
        "select (select count(*) from public.observacoes) observations,(select count(*) from public.fotos) photos",
      )
    ).rows[0];
    assert.deepEqual(after, before);
    const result = {
      ...current,
      executado_em: new Date().toISOString(),
      cadastros_preservados: +checks.total,
      nao_verificados: +checks.unverified,
      observacoes_criadas: 0,
      fotos_criadas: 0,
    };
    await client.query("commit");
    await save("resultado.json", result);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}
try {
  await mkdir(`${dir}/raw`, { recursive: true });
  if (mode === "--prepare") await prepare();
  else {
    const snapshot = await json(`${dir}/snapshot.json`);
    assert.equal(sha(snapshot.rows), snapshot.hash_lote);
    assert.equal(snapshot.rows.length, 1914);
    const reportText = await readFile(
      "data/prefeitura/ipes_resumo.json",
      "utf8",
    );
    assert.equal(
      sha(reportText),
      snapshot.relatorio_sha256,
      "Relatório aprovado mudou.",
    );
    verifyRows(snapshot.rows, JSON.parse(reportText).por_codigo);
    loadLocalEnv();
    client = await databaseClient();
    client.on("error", (error) =>
      safeFailure("Falha na conexão do plano municipal", error),
    );
    await client.connect();
    if (mode === "--plan") {
      await client.query("begin read only");
      const plan = await inspect(snapshot);
      await client.query("rollback");
      await save("plano.json", {
        ...plan,
        gerado_em: new Date().toISOString(),
      });
      await writeFile(
        "docs/prefeitura-goiania/PLANO_IMPORTACAO.md",
        `# Plano municipal anterior à produção\n\nSimulação READ ONLY em ${new Date().toISOString()}. Nenhuma migration ou gravação de dados foi executada.\n\n| Ação | Quantidade |\n|---|---:|\n| Candidatos esperados | ${plan.esperados} |\n| Inserts em árvores | ${plan.inserts} |\n| Updates em árvores | ${plan.updates} |\n| Sem alteração | ${plan.sem_alteracao} |\n| Cadastros de origem novos | ${plan.inserts_por_tabela.cadastros_municipais} |\n| Versões históricas novas | ${plan.inserts_por_tabela.cadastros_municipais_versoes} |\n| Observações/fotos fictícias | 0 |\n| Confirmações por importação | 0 |\n| Conflitos bloqueantes | ${plan.conflitos_bloqueantes.length} |\n\nÁrvores atuais no banco: ${plan.arvores_existentes}. Migration pendente: ${plan.migration_pendente ? "sim" : "não"}. Status inicial: CADASTRO_PUBLICO / NAO_VERIFICADA, status de moderação PENDENTE. Nenhuma floração é inferida.\n\n## Alertas de proximidade\n\n${plan.pares_municipais_ate_10m.length} pares municipais a até 10m; ${plan.pares_municipais_ate_2m} pares a até 2m; ${plan.pares_coordenadas_identicas} pares com coordenadas idênticas. ${plan.proximidade_com_existentes.length} proximidades com árvores já existentes. Proximidade não comprova duplicação e não causa fusão automática. O participante e o moderador precisam selecionar a árvore apropriada.\n\nIDs, distâncias e conflitos completos: [plano privado local](../../.local-data/importacao-prefeitura/plano.json). Procedimento, schema e conservação histórica: [IMPORTACAO.md](IMPORTACAO.md).\n\n## Identificação do plano\n\nHash do lote: \`${plan.hash_lote}\`.\n\nHash da aprovação: \`${plan.hash_plano}\`.\n\nA aplicação requer aprovação explícita desse plano e o argumento --approved-plan com esse hash. O script valida novamente o banco, o conteúdo, a migration e o código do importador antes de escrever. Alterações relevantes exigem um plano novo.\n`,
        "utf8",
      );
      console.log(
        JSON.stringify(
          {
            ...plan,
            pares_municipais_ate_10m: plan.pares_municipais_ate_10m.length,
            proximidade_com_existentes: plan.proximidade_com_existentes.length,
          },
          null,
          2,
        ),
      );
    } else {
      const approved = await json(`${dir}/plano.json`),
        i = args.indexOf("--approved-plan");
      assert(
        i >= 0 && args[i + 1] === approved.hash_plano,
        "Informe --approved-plan HASH após aprovação explícita do plano.",
      );
      await apply(snapshot, approved);
    }
  }
} catch (error) {
  safeFailure(
    "Importação/simulação municipal interrompida; nenhuma credencial exibida",
    error,
  );
  await save("erro.json", {
    modo: mode,
    em: new Date().toISOString(),
    codigo: error?.code || null,
  });
} finally {
  if (client) await client.end().catch(() => {});
}
