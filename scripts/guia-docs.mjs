import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const code = ts.transpileModule(
  await readFile("src/content/guide.ts", "utf8"),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  },
).outputText;
const context = {
  exports: {},
  require: createRequire(new URL("../src/content/guide.ts", import.meta.url)),
};
vm.runInNewContext(code, context);
const { guide, guideSources, guideImages, factLabels, photoParts } =
  context.exports;
const taxonomy = JSON.parse(
  await readFile("research/guia/taxonomia-flora-gbif.json", "utf8"),
);
const date = taxonomy.retrievedAt.slice(0, 10);
for (const dir of ["docs/guia", "docs/metodologia", "data/guia"])
  await mkdir(dir, { recursive: true });
const write = (path, text) => writeFile(path, `${text.trim()}\n`);
const csv = (row) =>
  row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",");
const botanicalRows = [];
for (const p of guide) {
  const ids = new Set([
    ...p.taxonomySources,
    ...p.note.sources,
    ...p.clue.sources,
    ...Object.values(p.facts).flatMap((f) => f.sources),
  ]);
  for (const id of ids) {
    const s = guideSources[id];
    botanicalRows.push([
      p.taxon,
      s.title,
      s.url,
      s.type,
      s.scope,
      date,
      "Paráfrase educativa; não determina indivíduos. Campos sem fonte sinalizados como pendentes.",
    ]);
  }
}
for (const r of taxonomy.records) {
  for (const record of r.records)
    botanicalRows.push([
      r.name,
      "Flora e Funga do Brasil — lista oficial / JBRJ, distribuída no GBIF",
      `https://www.gbif.org/species/${record.key}`,
      "Lista oficial / táxon individual",
      `${record.taxonomicStatus}: ${record.accepted ?? record.scientificName}`,
      date,
      `Consulta reproduzível: ${r.url}; identificação nominal, não de árvore em campo.`,
    ]);
  const used = new Set(guide.flatMap((p) => p.synonyms));
  for (const synonym of r.synonyms ?? []) {
    if (!used.has(synonym.canonicalName)) continue;
    botanicalRows.push([
      r.name,
      "Flora e Funga do Brasil — sinônimo na lista oficial / JBRJ",
      `https://www.gbif.org/species/${synonym.key}`,
      "Lista oficial / sinônimo",
      `${synonym.scientificName} → ${r.name}`,
      date,
      `Consulta reproduzível: ${r.synonymsUrl}; nome histórico preservado separadamente.`,
    ]);
  }
}
await write(
  "data/guia/fontes_botanicas.csv",
  [
    [
      "especie",
      "fonte",
      "url",
      "tipo_fonte",
      "informacao_utilizada",
      "data_acesso",
      "observacoes",
    ],
    ...botanicalRows,
  ]
    .map(csv)
    .join("\n"),
);
await write(
  "docs/guia/README.md",
  `# Guia de identificação

Implementado em /guia: entrada visual com quatro cards de ipês e três semelhantes, sem expansão inline. Cada grupo tem ficha própria; comparação, fotografia e fontes têm páginas dedicadas. O comparador livre conserva os atalhos prioritários e a comparação específica de ipê-branco com Tabebuia elliptica. Fotografias, créditos e referências acompanham o conteúdo. Versão editorial em ${date}, sem chancela de especialista.

Experiência em cinco níveis: reconhecimento visual → pistas rápidas → comparação → informação botânica completa → fontes e metodologia. Rotas, decisões de apresentação e limites das imagens em [arquitetura de informação](ARQUITETURA_INFORMACAO.md).

Objetivo: ajudar a observar características e registrar melhores evidências. Não é chave de identificação validada nem classificação automática. Nomes populares não correspondem necessariamente a uma espécie.

| Grupo | Táxon de referência | Situação |
| --- | --- | --- |
${guide.map((p) => `| ${p.name} | ${p.taxon} | Parcial; pendências explícitas |`).join("\n")}

Conteúdo em [guide.ts](../../src/content/guide.ts); fotos em [guide-images.json](../../src/content/guide-images.json). Interface: [page.tsx](../../src/app/guia/page.tsx), [guide.css](../../src/app/guia/guide.css), [comparador](../../src/components/guide-comparator.tsx), [foto e fallback](../../src/components/guide-photo.tsx), [fatos e fontes](../../src/components/guide-fact.tsx).

Inventários: [fontes botânicas](../../data/guia/fontes_botanicas.csv), [imagens](../../data/guia/imagens_referencia.csv). Consulte [metodologia](METODOLOGIA.md), [fontes botânicas](FONTES_BOTANICAS.md), [fontes visuais](FONTES_VISUAIS.md), [licenças](LICENCAS.md), [revisão pendente](REVISAO_PENDENTE.md) e [metodologia geral](../metodologia/01-visao-geral.md).

Não foram alterados mapa, banco, importação, registro ou moderação. Fotos do guia são referências independentes dos registros do mapa. Recomendações fotográficas são opcionais.

Reprodução: Node >=22.12; node scripts/guia-taxonomy.mjs consulta a lista oficial; node scripts/guia-research.mjs registra buscas visuais; node scripts/guia-images.mjs baixa seleções com validação de licença e otimiza; --offline recompõe manifestos usando evidência e arquivos locais. node scripts/guia-docs.mjs atualiza inventários/documentação. Não executar atualização de fontes sem revisar novamente conteúdo e licenças. Assets existentes são preservados; para substituir uma foto, revisar a seleção, evidência e arquivo local como uma única mudança.

O componente de fotos trata ausência e erro de carregamento, preservando a atribuição de arquivos existentes. Next/Image fornece dimensões, otimização e carregamento preguiçoso; só o comparador e tratamento de falha exigem interação no navegador. Sem consultas ao banco ou imagens remotas durante o uso do guia.
`,
);
await write(
  "docs/guia/METODOLOGIA.md",
  `# Metodologia do guia

Os sete grupos foram escolhidos pelo pedido do projeto e pela necessidade de distinguir árvores amarelas semelhantes. Fichas de grupos populares usam um táxon de referência explícito. Não extrapolamos sua descrição para todas as espécies do grupo.

Taxonomia: prioridade Flora e Funga do Brasil / JBRJ. Monografias de Cenostigma e Cassia foram consultadas diretamente. A lista oficial do mesmo publicador foi consultada pela API GBIF com datasetKey fixo, correspondência exata de canonicalName e leitura de taxonomicStatus; não usamos o backbone geral do GBIF. Registros, IDs e consulta estão em [snapshot](../../research/guia/taxonomia-flora-gbif.json). Esta é uma fotografia da versão distribuída, não garantia de sincronização imediata com o portal. Reconciliação nomenclatural e identificação individual continuam sujeitas a revisão botânica.

Caracteres: Embrapa, flora regional publicada e documentos institucionais. Cada fato contém IDs de fontes; todo campo sem sustentação disponível foi marcado como pendente. Referências geográficas acompanham alturas e meses: calendário de Pernambuco ou Índia não vira calendário de Goiânia. Duração não foi estimada. Descrição municipal não foi usada como prova de taxonomia de indivíduos.

Comparações: reutilizam os mesmos fatos das fichas, sem introduzir características exclusivas. Amarelo × três semelhantes compara flor, disposição, folhas, casca, porte, copa, fruto, folhagem e época. Rosa × roxo compara dois exemplos com aviso de sobreposição; cinco folíolos aparecem em ambos. Branco × T. elliptica usa a comparação explícita do tratamento de Pernambuco, sem alegar ocorrência de T. elliptica em Goiânia. Sua fotografia ficou pendente.

Imagens: busca em Wikimedia Commons; verificação individual de autoria, licença, descrição e tipo de órgão. [Evidência de metadados](../../research/guia/imagens-selecionadas.json) preserva os campos originais da API. As imagens foram inspecionadas visualmente; a identificação declarada pelo repositório não substitui confirmação por especialista. Uma foto de copa não foi descrita como detalhe de folha. Nenhuma foto é atribuída a árvores municipais. Não corrigimos cores para forçar distinção rosa/roxo.

Conversão: resolução máxima de 1280 × 1280, proporção preservada, WebP qualidade 82. Enquadramento de apresentação pode recortar; crédito registra a alteração. Hash SHA-256 e tamanho dos derivados no manifesto. Manter licença BY-SA dos dois derivados correspondentes.

Fontes adicionais investigadas: páginas institucionais e PDFs têm imagens úteis, mas atribuição textual não é autorização. iNaturalist foi examinado como alternativa via [ajuda oficial](https://www.inaturalist.org/pages/help); licença de observação e licença de foto devem ser verificadas separadamente. Nenhuma imagem iNaturalist foi adotada nesta rodada. Fontes do JBRJ foram usadas para fatos, sem extrair fotos cuja licença individual não foi comprovada. Não houve pedido de autorização nem contato com autores.

Revisão: [lista objetiva](REVISAO_PENDENTE.md). Relação com ciência cidadã em [metodologia geral](../metodologia/05-ciencia-cidada.md).

Apresentação: reconhecimento visual → pistas rápidas → comparação → informação botânica completa → fontes e metodologia. A entrada usa cards com links para fichas próprias; comparador, fotografia e fontes têm páginas dedicadas. Detalhes e tabelas começam recolhidos, sem retirar conteúdo ou referências. A refatoração não altera taxonomia, evidências, licenças ou regras do mapa. Decisões em [arquitetura de informação](ARQUITETURA_INFORMACAO.md).
`,
);
await write(
  "docs/guia/FONTES_BOTANICAS.md",
  `# Fontes botânicas

Consulta em ${date}. [Inventário CSV completo](../../data/guia/fontes_botanicas.csv). Informação aceita significa nome na fonte consultada; não identificação dos exemplares municipais.

${guide.map((p) => `## ${p.name}\n\nTáxon de referência: ${p.taxon}.\n\n${[...new Set([...p.taxonomySources, ...Object.values(p.facts).flatMap((f) => f.sources), ...p.note.sources])].map((id) => `- [${guideSources[id].title}](${guideSources[id].url}) — ${guideSources[id].scope}`).join("\n")}`).join("\n\n")}

## Correspondências cadastrais, sem sobrescrever história

Origem: [relatório aprovado](../prefeitura-goiania/RELATORIO_INVESTIGACAO.md), [dicionário municipal](https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/ARV%20CDESPECIE.htm), lista oficial JBRJ no snapshot citado. Grafias mantidas literalmente na coluna municipal; correspondências são documentais, não determinações dos indivíduos.

| Código | Nome municipal original | Referência taxonômica consultada | Observação |
| --- | --- | --- | --- |
| 16 | Tabebuia impetiginosa | Handroanthus impetiginosus | Município chama roxo; ficha rosa é exemplo do mesmo táxon. |
| 36 | Tabebuia vellosoi | Handroanthus vellosoi | Correspondência de sinônimo na lista oficial; ficha própria futura. |
| 118 | Tabebuia chrysotricha | Handroanthus chrysotrichus | Correspondência de sinônimo; descrição popular municipal não prova habitat nativo. |
| 119 | Tabebuia rosea | Tabebuia rosea | Nome aceito; táxon distinto de H. impetiginosus; ficha própria pendente. |
| 166 | Tabebuia roseo-alba | Tabebuia roseoalba | Grafia antiga separada; nomenclatura complementar pendente. |
| 175 | Tabebuia serratifolia | Handroanthus serratifolius | Documentado também pelo CNCFlora/JBRJ. |
| 176 | Tabebuia heptaphylla | Handroanthus heptaphyllus | Correspondência nas referências Embrapa e Flora; não confirmada em campo. |
| 306 | Tabebuia aurea (Manso) | Tabebuia aurea | Continua em Tabebuia na lista oficial; não converter todo ipê para Handroanthus. |

Não houve alteração de dados históricos, códigos, geometria ou importação. O guia diferencia nomenclatura atual e descrição original.
`,
);
const totalBytes = guideImages.reduce((sum, i) => sum + i.bytes, 0);
await write(
  "docs/guia/FONTES_VISUAIS.md",
  `# Fontes visuais

${guideImages.length} fotografias utilizadas; ${(totalBytes / 1048576).toFixed(2)} MiB em arquivos WebP locais antes da otimização responsiva do Next/Image. Download e evidência em ${date}. Foto ilustrativa de referência, sem representar registro municipal ou ocorrência atual de florada. Algumas imagens de árvore mostram a copa, não a árvore inteira.

| Ficha / parte | Táxon declarado pela fonte | Autor | Licença | Fonte |
| --- | --- | --- | --- | --- |
${guideImages.map((i) => `| ${i.profile} / ${i.part} | ${i.taxon} | ${i.author} | [${i.license}](${i.licenseUrl}) | [original](${i.sourceUrl}) |`).join("\n")}

São ${guideImages.filter((i) => i.license === "CC0").length} CC0, ${guideImages.filter((i) => i.license.startsWith("CC BY ")).length} CC BY e ${guideImages.filter((i) => i.license.startsWith("CC BY-SA")).length} CC BY-SA. Licença de uso verificada; identificação botânica das imagens ainda requer revisão humana. Todos os créditos estão visíveis no app, incluindo fonte, licença e alterações.

Alternativas não publicadas: flor de Cassia fistula da UENF, atribuída a Deborah Barroso (requer autorização); casca de ipê-rosa no capítulo da Embrapa, atribuída a Waldemar H. Zelazowski (licença da foto indefinida). Não presumimos que a licença editorial do PDF autorize todas as imagens. Registro em [CSV](../../data/guia/imagens_referencia.csv).

Faltas por grupo (árvore/copa, flor, folha, casca e fruto):

${guide
  .map(
    (p) =>
      `- ${p.name}: ${
        Object.keys(photoParts)
          .filter(
            (part) =>
              !guideImages.some((i) => i.profile === p.id && i.part === part),
          )
          .map((part) => photoParts[part])
          .join(", ") || "nenhuma"
      }.`,
  )
  .join("\n")}

Tabebuia elliptica: nenhuma foto adotada, fallback explícito. As buscas amplas são pistas de investigação, não um banco de imagens autorizado: research/guia/*json. O script só publica uma seleção fechada e verificada. Não adotamos ilustrações de livros nem imagens genéricas para preencher órgãos ausentes.
`,
);
await write(
  "docs/guia/LICENCAS.md",
  `# Licenças e atribuição

Preferência: CC0, depois CC BY, depois CC BY-SA quando a distribuição do derivado puder cumprir a mesma licença. Nesta seleção: CC0 1.0, CC BY 2.0/3.0 e CC BY-SA 3.0. A licença do texto da página Commons não é a licença do arquivo: verificamos LicenseShortName, LicenseUrl, Artist e descrição em cada arquivo.

Crédito visível: “Foto: Autor — licença”, com links para página original e texto da licença, mais indicação de redimensionamento, conversão WebP e enquadramento de exibição. Mesmo CC0 recebe crédito editorial. Não sugerimos endosso pelo autor. Os dois arquivos BY-SA (branco-flor.webp e branco-fruto.webp) são distribuídos como derivados sob [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/), com atribuição a H. Zell. Preservar estas condições se copiar ou redistribuir os assets. A licença específica das fotos não licencia automaticamente o restante do código do projeto.

CC0: [termo](https://creativecommons.org/publicdomain/zero/1.0/). CC BY: [2.0](https://creativecommons.org/licenses/by/2.0/), [3.0](https://creativecommons.org/licenses/by/3.0/). Sem mudança de cor ou composição botânica. Conversão e redimensionamento registrados no manifesto.

Estados do inventário:

- APROVADA: CC0 verificada, adotada nesta seleção.
- REQUER_ATRIBUICAO: uso permitido sob licença explícita; atribuição atendida no app. Não significa autorização pendente.
- REQUER_AUTORIZACAO: fonte potencial sem permissão comprovada; não publicada.
- LICENCA_INDEFINIDA: licença individual não comprovada; não publicada.
- NAO_USAR: direitos reservados, condições incompatíveis ou imagem inadequada; nenhuma dessa categoria foi adotada.

Não aceitamos licença presumida, “está online”, imagem do Google, All Rights Reserved ou extração de livro sem permissão. BY-NC/BY-ND não fazem parte da seleção adotada. Autor identificado não basta para liberar uso. A autoria institucional ou de portal não torna a imagem domínio público.

Evidência: [API Commons](../../research/guia/imagens-selecionadas.json), [manifesto e hashes](../../src/content/guide-images.json), [inventário](../../data/guia/imagens_referencia.csv). Solicitações de autorização não foram enviadas.
`,
);
await write(
  "docs/guia/REVISAO_PENDENTE.md",
  `# Revisão humana pendente

Nenhuma ficha é cientificamente definitiva. Fichas com todos os campos exigidos comprovados: **nenhuma**. Todas as sete têm conteúdo parcial, fontes verificadas e lacunas explícitas; duração típica e validação local continuam pendentes.

| Ficha | Campos botânicos pendentes |
| --- | --- |
${guide
  .map(
    (p) =>
      `| ${p.name} | ${Object.entries(p.facts)
        .filter(([, f]) => f.pending)
        .map(([key]) => factLabels[key])
        .join("; ")} |`,
  )
  .join("\n")}

Especialista: revisar caráter diagnóstico versus pista, variação dentro da espécie, adequação das comparações e exemplos rosa/roxo. Cinco folíolos não separam H. impetiginosus de H. heptaphyllus. Validar fotos identificadas pelos repositórios; licença aprovada não é taxonomia aprovada.

Taxonomia: nomes aceitos e sinônimos selecionados confirmados na versão distribuída da lista JBRJ; verificar atualidade do espelho em relação ao portal. A lista consultada trata Handroanthus roseo-albus como sinônimo de Tabebuia roseoalba e Bignonia stans como sinônimo de Tecoma stans. Cassia fistula não retornou sinônimos nessa versão: isso não prova ausência em toda a literatura. Especialista deve revisar a seleção nomenclatural e os conflitos históricos. Criar fichas específicas futuras para T. rosea, H. vellosoi, H. chrysotrichus e T. aurea, sem aplicar descrição de H. serratifolius a todos. Levantar quais outras espécies recebem chuva-de-ouro no contexto local.

Calendário: validar Goiânia por observações datadas, clima e séries anuais. Julho em Goiás na referência de H. impetiginosus não é previsão; nenhum período regional foi transferido para outro lugar. Não estimar duração sem estudo adequado. Alturas são contextuais, não limites urbanos.

Fotografia: ${guideImages.length} fotos com uso licenciado (${guideImages.filter((i) => i.status === "APROVADA").length} APROVADA; ${guideImages.filter((i) => i.status === "REQUER_ATRIBUICAO").length} REQUER_ATRIBUICAO, atendida). Duas fontes potenciais bloqueadas: flor da UENF requer autorização; casca Embrapa com licença individual indefinida. Não houve contato com autores. Lista por órgão em [fontes visuais](FONTES_VISUAIS.md). Buscar fotos locais autorizadas e detalhe de casca para todos os grupos; T. elliptica sem foto adotada.

Revisão de campo: confirmar existência, localização e identificação das árvores municipais com evidência recente. O guia não resolve essas lacunas nem muda status. Recomendações fotográficas opcionais mantêm o cadastro acessível.

Validação de interface e checks nesta rodada: ver [VALIDACAO.md](VALIDACAO.md), atualizado após os testes.
`,
);
const methodDocs = {
  "01-visao-geral.md": `# Visão geral metodológica\n\nO Mapa dos Ipês combina candidatos cadastrais, observações de ciência cidadã e revisão comunitária. O guia educativo melhora a observação, sem fornecer confirmação automática. Cada evidência tem origem e data; confiança não é inferida apenas de cor ou nome.\n\nÍndice: [fontes](02-fontes-de-dados.md), [Prefeitura](03-prefeitura-goiania.md), [proveniência](04-proveniencia-e-confianca.md), [ciência cidadã](05-ciencia-cidada.md), [guia e licenças](06-guia-botanico-e-licencas.md), [sensoriamento remoto](07-sensoriamento-remoto.md), [design](08-decisoes-de-design.md). Implementação geral em [arquitetura](../ARQUITETURA.md).`,
  "02-fontes-de-dados.md": `# Fontes de dados\n\nCadastro municipal: serviço ArcGIS Árvore e dicionário histórico; método e limitações em [investigação](../prefeitura-goiania/RELATORIO_INVESTIGACAO.md). Observações: contribuições reais de usuários, tratadas pela moderação existente. Guia: JBRJ/Flora e Funga, Embrapa, literatura científica e guias institucionais, conforme [inventário botânico](../../data/guia/fontes_botanicas.csv).\n\nFotos do guia: referências independentes, não observações de árvores cadastradas; [inventário visual](../../data/guia/imagens_referencia.csv). Versão, data e licença acompanham a fonte. Taxonomia e direitos de imagem são verificações distintas.`,
  "03-prefeitura-goiania.md": `# Cadastro municipal de Goiânia\n\nA investigação aprovada identificou 1.914 candidatos na camada Árvore (3), em oito códigos. Plantio (4) não integra esse conjunto. Consulte [investigação](../prefeitura-goiania/RELATORIO_INVESTIGACAO.md), [importação](../prefeitura-goiania/IMPORTACAO.md) e [execução](../prefeitura-goiania/EXECUCAO_IMPORTACAO.md) para procedimentos e histórico. Esta rodada não altera importação ou banco.\n\nDescrição municipal ≠ confirmação taxonômica atual; cor cadastrada ≠ floração observada; existência cadastral ≠ existência atual. Nomes antigos e grafias permanecem na proveniência. O guia documenta correspondências separadas em [fontes botânicas](../guia/FONTES_BOTANICAS.md), sem converter registros automaticamente.`,
  "04-proveniencia-e-confianca.md": `# Proveniência e confiança\n\nA origem municipal é preservada por fonte, dataset, camada, OBJECTID, espécie e descrição originais, geometria e atributos brutos. Chave composta evita duplicação; geometria histórica EPSG:31982 é distinta da geometria da aplicação EPSG:4326. Especificação em [importação](../prefeitura-goiania/IMPORTACAO.md).\n\nCADASTRO_PUBLICO expressa origem. VERIFICADA_FOTOGRAFICAMENTE expressa evidência comunitária aprovada e não apaga a origem cadastral. Observação datada de flores é outra informação: cor de ícone não prova florada presente. Nomenclatura aceita em uma lista não é validação botânica da árvore individual. Estrutura atual em [banco](../BANCO.md); nenhuma mudança de regras nesta rodada.`,
  "05-ciencia-cidada.md": `# Guia e ciência cidadã\n\nFluxo conceitual: observar → consultar guia → fotografar características relevantes → registrar → moderação → dado mais confiável. O objetivo é reduzir erros de identificação, falsos positivos entre árvores amarelas e registros pouco documentados. A eficácia ainda não foi medida; não alegamos redução comprovada.\n\nFolha inteira, flor, copa, casca, fruto e base do tronco oferecem pistas complementares. Fotografias adicionais são sugestões opcionais: nenhum requisito novo no cadastro. Na dúvida, usar “Não sei”. A moderação segue o fluxo existente. Sem IA de identificação, classificação de foto, reputação ou recomendação automática. Conteúdo e limitações em [guia](../guia/README.md).`,
  "06-guia-botanico-e-licencas.md": `# Guia botânico e licenças\n\nO guia usa táxons de referência explícitos para sete grupos populares. Rosa/roxo se sobrepõem; amarelo abrange várias espécies. Fonte acompanha cada fato, lacunas permanecem visíveis e calendários são regionais. Processo em [metodologia do guia](../guia/METODOLOGIA.md).\n\nFotos: CC0, CC BY e BY-SA compatível, com crédito, fonte, licença e indicação de alterações. Autoria não é autorização; licenças desconhecidas ficam fora do app. Não confundir a licença da página com a foto. [Política e condições dos derivados](../guia/LICENCAS.md), [inventários](../guia/README.md), [revisão pendente](../guia/REVISAO_PENDENTE.md).`,
  "07-sensoriamento-remoto.md": `# Sensoriamento remoto\n\nHipótese de pesquisa futura: relacionar observações espaciais e temporais de campo com séries de satélite. Não há detecção operacional de espécie/florada, classificação automática ou identificação por imagem nesta entrega.\n\nO notebook exploratório existente e suas limitações são documentados em [pesquisa](../PESQUISA.md) e [research/README](../../research/README.md). Separar resolução espacial, mistura de copas, nuvens, sazonalidade e incerteza taxonômica antes de inferir sinais. Nenhum índice espectral foi usado para confirmar os candidatos municipais ou as fichas do guia.`,
  "08-decisoes-de-design.md": `# Decisões de design\n\nMapa como protagonista e ícones botânicos já definidos: [hierarquia visual](../HIERARQUIA_VISUAL_MAPA.md), [mapa botânico](../MAPA_BOTANICO.md). Esta rodada preserva o mapa integralmente.\n\nGuia de campo: entrada leve com quatro cards de ipês e três semelhantes, sem expansão inline. Fichas próprias, comparador, fotografia e fontes em páginas dedicadas. Cinco níveis: reconhecimento visual → pistas rápidas → comparação → informação botânica completa → fontes e metodologia. Acordeões fechados preservam todos os fatos e referências. Comparador mostra imagens antes das pistas e da tabela técnica opcional; cores não são evidência diagnóstica. No mobile, galeria horizontal e tabela adaptada em duas colunas, com cabeçalhos semânticos. [Arquitetura de informação](../guia/ARQUITETURA_INFORMACAO.md).\n\nCréditos sempre visíveis; fallback informa foto pendente/indisponível. Capas usam referências de árvore/copa, sem substituir ausência por close de flor. Pendências botânicas não são preenchidas por ilustrações inventadas. Dicas fotográficas opcionais melhoram evidência sem impor novas etapas ao registro. CSS limitado às rotas do guia.`,
};
for (const [file, text] of Object.entries(methodDocs))
  await write(`docs/metodologia/${file}`, text);
console.log(
  `Documentação e fontes geradas: ${botanicalRows.length} referências, ${guideImages.length} imagens.`,
);
