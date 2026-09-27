# Mapa-base, composição desktop e verificação — 27/09/2026

Refinamento limitado à apresentação. Não altera banco, importação, coordenadas, validação, moderação ou fluxo de cadastro. A clusterização permanece com raio 24px e zoom máximo 11; a partir do zoom 12, as árvores são individuais.

## Mapa-base

O Dataviz Light personalizado recuperou cor e contraste: fundo quente `#f3efe3`, áreas residenciais `#e9eadf`, edifícios discretos `#dde0d3`, avenidas em areia `#ded7bd` com contorno `#b1b8a5`, vias secundárias claras, áreas verdes `#c8ddb8` e água azul `#9ecfdf`. Córregos e rios têm traço azul mais definido `#87bacd`.

Os rótulos principais receberam contraste maior. Nomes de parques e cursos d'água continuam dependentes dos nomes disponíveis nos tiles; os POIs comerciais permanecem ocultos. O fallback OpenStreetMap também recuperou parte da saturação e opacidade, embora não permita a mesma seleção de camadas do mapa vetorial.

## Composição desktop

Busca e filtros passaram a integrar uma única superfície no topo, centralizada, de até 660px. A busca ocupa a primeira linha, separada dos filtros por uma divisória leve. Os filtros avançados permanecem na mesma ação existente.

O card Ipês em Goiânia passou a ser um painel inferior centralizado, de até 780px. Título e ação Explorar ficam à esquerda; métricas à direita; contagem de árvores na janela e indicação Goiânia, GO compartilham o rodapé. Os dois painéis se alinham pelo centro, com borda, fundo e sombra coerentes. A localização da cidade deixa de ser mais uma bolha solta no mapa.

Entre 768 e 1000px, o painel inferior adapta título e métricas para linhas separadas. No mobile, a busca permanece no topo e as estatísticas no bottom sheet; a localização também integra seu rodapé. O mapa conserva toda a área disponível abaixo do header. Legenda e controles continuam discretos à direita.

## Confirmação e opacidade

| Tipo                                  | Opacidade | Detalhe                                         |
| ------------------------------------- | --------- | ----------------------------------------------- |
| Municipal sem verificação comunitária | 0,65      | Selo vazado com folha, sombra mais leve         |
| Verificação comunitária               | 1         | Selo preenchido com check, sombra mais definida |

A expressão `icon-opacity` na camada de símbolos usa a função existente `municipalUnverified`. A opacidade não é aplicada ao mapa inteiro, a fotografias ou ao painel da árvore. Uma árvore municipal verificada fotograficamente deixa de receber a aparência secundária, mantendo os dados de proveniência originais.

As mesmas paletas cadastrais e silhuetas botânicas foram preservadas. As cores dos confirmados aparecem mais vivas pelo uso integral da paleta; nenhum tipo ou observação de florada é inferido. Os confirmados são desenhados acima dos não verificados quando as copas se sobrepõem, usando `symbol-sort-key` na mesma camada. O ipê branco conserva halo claro e contorno verde escuro. A legenda apresenta a mesma diferença de opacidade. Os clusters continuam agregados botânicos neutros com contador legível; não são selos de confirmação de todas as árvores do agrupamento.

## Implementação

- `src/lib/map-basemap.ts`: cor, contraste das vias, vegetação, água e rótulos.
- `src/components/map.tsx`: propriedade visual no GeoJSON e opacidade da camada de símbolos.
- `src/components/botanical-map-markers.ts`: intensidade de sombra das duas variantes do atlas.
- `src/components/home.tsx`: localização da cidade integrada ao rodapé do painel.
- `src/app/globals.css`: composição central, superfície única da busca/filtros e adaptação responsiva.

O atlas continua com 14 imagens e os pontos continuam em WebGL. Não foi adicionada camada extra nem marcador HTML para cada árvore. Pan/zoom não substituem o GeoJSON nem consultam novamente as árvores.

## Revisão e reprodução

Os testes de UX conferem o alinhamento central dos dois painéis em 1440 e 1920px e preservam as verificações de 390px, filtros, expansão, carregamento único e instalação discreta. As fixtures visuais incluem municipais não verificados e municipais com verificação comunitária, exclusivamente no navegador de testes.

Lint, TypeScript e build de produção aprovados. Os dez fluxos existentes passaram, e a reexecução final dos cinco testes de mapa/UX passou nas três larguras. O teste de UX usa a preferência de movimento reduzido para evitar corridas entre cliques consecutivos nos controles; as animações normais da aplicação permanecem iguais.

O cadastro real atualmente contém os candidatos municipais importados, sem confirmações fotográficas fictícias. Por isso, a comparação das duas aparências usa fixtures de teste e a prancha [contraste-marcadores.svg](validacao/contraste-marcadores.svg), que mostra as duas variantes no mesmo tamanho, com opacidades 0,65 e 1. Os números de contraste referem-se ao contorno contra cores planas; não certificam a acessibilidade do mapa inteiro.

Revisão real em produção: após `npm run build`, executar `node scripts/map-performance-review.mjs --production --hierarchy` usando Node 22. Capturas usam `hierarquia-mapa-*`, e o relatório usa `metricas-hierarquia-mapa.json`, preservando as capturas históricas anteriores.

Revisão realizada com as 1.914 árvores, em quatro páginas iniciais e 1.638.038 bytes de JSON. Nas três larguras, houve zero consultas adicionais de árvores durante pan/zoom e filtros, zero `setData` durante navegação, zero erros de JavaScript e nenhum overflow horizontal. Não apareceram clusters no zoom inicial 12,4 ou no zoom de bairro; ao afastar, foram observados 38 agrupamentos visíveis.

| Largura | Primeira consulta | Conjunto completo | Marcadores desde a navegação |
| ------- | ----------------- | ----------------- | ---------------------------- |
| 1440px  | 1.511ms           | 2.623ms           | 3.095ms                      |
| 1920px  | 323ms             | 775ms             | 1.750ms                      |
| 390px   | 314ms             | 683ms             | 1.613ms                      |

Os tempos variam com a rede. Capturas reais: [1440px](validacao/hierarquia-mapa-real-1440.png), [1920px](validacao/hierarquia-mapa-real-1920.png) e [390px](validacao/hierarquia-mapa-real-390.png). Comparação de estados: [PNG](validacao/comparacao-verificacao.png). Resultados completos: [metricas-hierarquia-mapa.json](validacao/metricas-hierarquia-mapa.json).

## Ajustes posteriores possíveis

Calibrar a opacidade municipal entre 0,65 e 0,70 em aparelhos físicos; ajustar a tonalidade das avenidas por zoom; revisar o tamanho do painel inferior em notebooks de pouca altura. Esses ajustes podem permanecer apenas na apresentação.
