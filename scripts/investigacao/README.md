# Investigação pública da Prefeitura de Goiânia

O script consulta somente `portalmapa.goiania.go.gov.br`. Não lê `.env`, não usa credenciais e não acessa o Supabase. Requer Node **22.12 ou superior**, com suporte a TypeScript nativo.

```powershell
node --experimental-strip-types scripts/investigacao/prefeitura-goiania.ts --self-test
node --experimental-strip-types scripts/investigacao/prefeitura-goiania.ts
```

Se o Node local for antigo:

```powershell
npm exec --package=node@22 -- node --experimental-strip-types scripts/investigacao/prefeitura-goiania.ts
```

A execução faz chamadas sequenciais, separadas por no mínimo 400ms, e retenta erros de transporte/HTTP 429/5xx até três vezes. Usa metadata, distinct sem filtro inicial, count e statistics; pagina resultados em lotes de até 1000 e interrompe se a página se repetir. Erros ArcGIS, esquema inesperado ou falhas nas contagens interrompem o processo. Não contorna restrições de acesso. Uma falha deixa o manifesto com erro; artefatos derivados de execuções anteriores não devem ser confundidos com uma execução completa. Verifique `completedAt`, `failedAt` e a data dos arquivos.

Baixa **até 50 árvores**, estratificadas pelos códigos identificados, com os primeiros OBJECTID de cada espécie. A amostra não é aleatória nem estima a taxa de erros da base inteira. Examina somente cinco registros de Plantio, além das estatísticas dessa camada, mantendo-a separada. A geometria de um polígono municipal oficial serve à verificação espacial.

A verificação da amostra usa o polígono municipal original. Para a contagem global, primeiro testa se o envelope da camada está totalmente dentro desse limite. Quando não está, solicita ao próprio serviço uma generalização de 0,0001 grau (cerca de 11m), com precisão de seis casas: a contenção municipal global é então **aproximada**. A validade numérica das coordenadas WGS84 é contada separadamente no envelope. Nenhum desses testes confirma precisão em campo ou existência atual da árvore.

Todos os bytes consultados são preservados em `data/prefeitura/evidencias/reproduzivel/`. O manifesto `data/prefeitura/consultas.json` contém URL, parâmetros, horário UTC e SHA-256. Uma nova execução online substitui esse snapshot: copie o diretório antes de atualizar se precisar manter versões históricas. A execução offline verifica hashes e consultas antes de regenerar os arquivos:

```powershell
node --experimental-strip-types scripts/investigacao/prefeitura-goiania.ts --replay
```

O dicionário HTML é decodificado pelo charset declarado, preservando o original. A seleção depende exclusivamente de códigos observados associados a `Tabebuia` ou `Handroanthus` no nome científico municipal. Não atualiza sinonímias, não atribui cor implícita e exclui correspondências lexicais de outros gêneros.

Saídas: `data/prefeitura/especies_distintas.json`, `ipes_resumo.json`, `ipes_amostra.geojson`, `qualidade.json`, `limite_goiania.geojson`, metadados e evidências; documentos em `docs/prefeitura-goiania/`. Os autotestes verificam entidades HTML, parsing, ponto em polígono com buraco/borda e distância. O replay permite conferir toda a análise sem novas requisições.
