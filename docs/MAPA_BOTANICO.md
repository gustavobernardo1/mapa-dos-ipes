# Visualização botânica do mapa

Apresentação atual: [HIERARQUIA_VISUAL_MAPA.md](HIERARQUIA_VISUAL_MAPA.md). A definição de densidade e desenho está em [REFINAMENTO_VISUAL_MAPA.md](REFINAMENTO_VISUAL_MAPA.md). A arquitetura de carregamento único e as medições iniciais estão em [UX_MAPA_PERFORMANCE.md](UX_MAPA_PERFORMANCE.md).

Os círculos de agrupamento e os pontos individuais foram substituídos por árvores ilustradas em SVG: copa assimétrica com flores, tronco, folhas, contorno claro e sombra suave. A referência utilizada foi a imagem `Mapa dos Ipês_ Goiânia em Flor.png`, existente na raiz; o caminho solicitado `docs/referencias/mapa-mockup.png` não estava presente.

## Arquivos

- `src/lib/botanical-icons.ts`: desenho vetorial compartilhado, paletas e regras de classificação/tamanho.
- `src/components/botanical-map-markers.ts`: atlas dos ícones individuais e controlador dos clusters HTML.
- `src/components/map.tsx`: integração com a fonte GeoJSON e a camada de símbolos MapLibre.
- `src/components/home.tsx`: transmite a cor do filtro ativo para os clusters.
- `src/components/tree-detail.tsx`: mostra o ícone botânico da árvore no mapa da ficha.
- `src/app/globals.css`: tamanhos, contador, sombra, foco e legenda responsiva.
- `public/map-icons/`: SVGs individuais amarelo, rosa, roxo, branco, rosa/roxo e verde; variantes municipais; clusters por paleta e pequeno/médio/grande.
- `scripts/prepare-botanical-icons.mjs`: gera os SVGs a partir do mesmo desenho usado na aplicação. Execute `npm run map:icons` após editar o desenho.

## Clusters

A clusterização continua no worker do MapLibre. Sua representação é um botão HTML com copa SVG e contador HTML centralizado, sem depender de fontes/glyphs externas. Não há camada de círculos de clusters.

O clique ou Enter solicita `getClusterExpansionZoom` e aproxima o mapa. Agrupamentos densos podem exigir mais de uma expansão quando vistos de longe. Os tamanhos são 48px para 2–19 árvores, 60px para 20–99 e 72px a partir de 100. O contador mantém o número inteiro, com separador de milhares, em fundo marfim e texto verde escuro. O SVG representa três copas, formando um pequeno bosque.

Amarelos, rosas/roxos e brancos acompanham o filtro. “Todos” e filtros sem cor específica usam copas verdes, douradas e rosas suaves. Esses acentos são decorativos; não representam proporções de espécies ou observações de florada.

## Árvores individuais e origem municipal

Os SVGs são rasterizados uma vez, em resolução dupla, e registrados no atlas do MapLibre. Uma camada `symbol` desenha as árvores em WebGL, com tamanho interpolado entre aproximadamente 31 e 48px conforme o zoom. Contorno e sombra ajudam a leitura sobre ruas e parques; os ícones brancos têm contorno escuro.

A classificação da aplicação permanece `ROSA_ROXO`. A descrição municipal explícita “rosa” ou “roxo” permite escolher a variante ilustrada correspondente. Quando não há essa distinção, o ícone usa a paleta combinada. Nenhuma classificação, identificação ou observação é inventada.

Candidatos municipais não verificados usam um pequeno selo vazado com folha e opacidade 0,65. Os ícones comunitários usam selo preenchido com check, opacidade 1 e sombra mais definida. O ipê branco conserva outline verde escuro. A legenda lembra que a cor indica o tipo de ipê, e não a florada atual. Proveniência, regras de validação, selo e CTA continuam preservados.

## Performance e limites

Somente clusters no viewport, com pequena margem, recebem elementos HTML. O controlador reutiliza os botões por ID, remove os que saem da área e deduplica features retornadas em tiles adjacentes. Não cria um elemento HTML para cada uma das 1.914 árvores.

A consulta de clusters é invalidada por mudanças na fonte, filtros e movimento. O evento de renderização só consulta quando há alterações; não refaz o SVG a cada frame. Os marcadores existentes acompanham o movimento, e a entrada/saída da janela é reconciliada durante a navegação.

O atlas tem 14 imagens de 192×192 pixels: aproximadamente 2MiB de pixels antes da organização interna das texturas. Há um pequeno custo inicial de decodificação e rasterização. Cada cluster visível ainda exige um botão DOM e uma sombra CSS; em escalas muito maiores, seria possível migrar clusters para símbolos WebGL, com tratamento adicional dos contadores e da acessibilidade. Não foi feito benchmark de FPS em aparelhos físicos.

O raio atual é 24px, com `clusterMaxZoom: 11`, preservando densidade e pequenas sobreposições. A partir do zoom 12, todas as árvores são individuais. Árvores com a mesma coordenada continuam sobrepostas quando a clusterização termina.

## Ajuste fino

Para se aproximar mais da referência, ajuste as paletas e a quantidade de pétalas em `botanical-icons.ts`, o tamanho das copas/contadores no CSS e a densidade em `clusterRadius`. Conserve a silhueta simples nos ícones menores. A hierarquia de avenidas, nomes de parques e bairros pode ser calibrada por zoom, preservando a cidade legível.

As capturas `docs/validacao/mapa-botanico-mobile.png` e `mapa-botanico-desktop.png` usam 1.914 registros simulados apenas no navegador e tiles de teste. As capturas `mapa-botanico-detalhe-*` mostram a expansão. Não são fotografias, observações ou dados inseridos no cadastro real.

As capturas `mapa-botanico-real-mobile.png` e `mapa-botanico-real-desktop.png` usam os dados municipais existentes e o mapa real. A revisão encontrou 1.349 árvores na janela móvel e as 1.914 na janela desktop, sem erro de JavaScript, aviso de mapa indisponível ou overflow horizontal. Para reproduzir com o servidor local em execução, use `node scripts/botanical-review.mjs`; `REVIEW_URL` permite escolher outro endereço.

Validação atual: 21 testes unitários e 15 testes de ponta a ponta aprovados, incluindo UX em 390, 1440 e 1920px. Os testes botânicos conferem 1.914 registros, contagem, filtro de cor, SVG no cluster, fundo transparente, expansão por Enter, seleção da árvore e CTA; os fluxos existentes também verificam expansão por clique. Lint, TypeScript e build de produção foram aprovados. Medições e capturas atuais estão em [REFINAMENTO_VISUAL_MAPA.md](REFINAMENTO_VISUAL_MAPA.md).

Referência técnica: [exemplo oficial de clusters HTML do MapLibre](https://maplibre.org/maplibre-gl-js/docs/examples/display-html-clusters-with-custom-properties/).
