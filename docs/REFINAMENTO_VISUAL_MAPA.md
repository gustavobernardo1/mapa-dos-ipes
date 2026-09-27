# Refinamento visual do mapa — 27/09/2026

Este documento registra a definição dos clusters tardios e as medições dessa rodada. A composição desktop, o mapa-base e a opacidade foram refinados depois, conforme [HIERARQUIA_VISUAL_MAPA.md](HIERARQUIA_VISUAL_MAPA.md).

Rodada de apresentação: mapa, ícones, agrupamentos e hierarquia dos overlays. Banco, dados, importação, regras de validação e fluxo de cadastro permanecem iguais.

## Decisões de design

O mapa continua ocupando toda a largura e a altura disponível no desktop. O header passou de 88 para 72px, com marca um pouco menor; no mobile mantém 76px e navegação inferior. Campanha e links institucionais deixam de formar seções empilhadas na home também no mobile; seus destinos continuam acessíveis pela navegação existente.

A busca fica acima dos filtros, agora mais compactos e distribuídos em uma linha no desktop. Espécie, confiança e data permanecem na ação secundária de filtros avançados. A legenda é recolhível e integrada aos controles: localização, zoom, reenquadramento de Goiânia e lista. Seu conteúdo preserva a distinção entre origem municipal e verificação comunitária e explica que a cor não representa florada atual.

O painel de estatísticas desktop passou de 470 para 430px, com título, métricas e ação Explorar mais discretos. O mobile preserva mapa e bottom sheet. A instalação permanece no menu, com a escolha de dispensá-la persistida; não foi adicionado um novo prompt.

## Agrupamentos e densidade

Configuração final em `src/components/map.tsx`:

```ts
clusterRadius: 24,
clusterMaxZoom: 11,
```

O raio anterior era 64px e o zoom máximo era 15. O novo raio permite que copas próximas coexistam por mais tempo. Foram experimentados os limites 12 e 11: a revisão real com limite 12 ainda mostrava 102 clusters na abertura desktop, que dominavam a composição. O limite final 11 permite abrir o mapa no zoom 12,4 com árvores individuais. Em zoom intermediário abaixo de 12, pequenos agrupamentos e árvores isoladas coexistem conforme a distribuição real das coordenadas; ao afastar, os agrupamentos ganham mais árvores. A partir do zoom 12, todos os pontos são individuais, inclusive em concentrações densas. Não há deslocamento artificial de coordenadas: árvores coincidentes continuam sobrepostas.

Cada cluster agora desenha um pequeno bosque com três copas assimétricas, troncos finos e poucas cores. O contador central tem fundo marfim e texto escuro. Tamanhos: 48px para 2–19 árvores, 60px para 20–99 e 72px para 100 ou mais. O filtro de cor continua definindo a paleta. Em Todos, as copas usam verde, dourado e rosa suaves; isso é decoração, não distribuição estatística de espécies. Clique ou Enter mantém a expansão pelo MapLibre.

## Mapa-base e árvores

Dataviz Light continua sendo a base. O fundo agora usa off-white quente `#f6f3eb`, ruas secundárias cinza claro `#e7e9e3`, avenidas mais perceptíveis `#d3d8cf` com borda `#bdc3b8`, parques `#d7e5cf` e água azul pastel `#bddde7`. Rótulos principais têm contraste maior; parques e cursos d'água continuam identificados conforme os nomes disponíveis nos tiles. POIs comerciais permanecem ocultos.

As copas ganharam dourado, rosa e violeta mais vivos. O branco mantém copa creme, halo claro e contorno verde escuro mais espesso. A sombra aumentou levemente e a escala inicial passou de aproximadamente 29 para 31px, crescendo até 48px. O detalhe municipal vazado e o selo comunitário preenchido permanecem, sem reduzir a opacidade das árvores.

O contorno branco apresenta contraste calculado de 8,51:1 sobre o fundo, 7,19:1 sobre o verde dos parques e 6,59:1 sobre a água. Os contornos amarelo, rosa e roxo também superam 3:1 nessas cores planas. Isso mede o contorno, não certifica a acessibilidade do mapa completo. A prancha está em [contraste-marcadores.svg](validacao/contraste-marcadores.svg).

## Implementação e performance

- `src/lib/botanical-icons.ts`: paletas e bosque SVG compartilhados com os arquivos de `public/map-icons/`.
- `src/lib/map-basemap.ts`: cores do mapa-base e hierarquia das vias e rótulos.
- `src/components/map.tsx`: densidade, escala dos símbolos, legenda e controles.
- `src/components/botanical-map-markers.ts`: sombra do atlas e reutilização dos clusters; posições só são reaplicadas quando mudam.
- `src/app/globals.css`: header, filtros, estatísticas, controles e tamanhos dos clusters.

As árvores continuam em uma camada WebGL; somente clusters visíveis usam botões HTML. O desenho é rasterizado uma vez em um atlas de 14 imagens. Há mais símbolos individuais em zoom intermediário, um custo visual deliberado para preservar densidade. Não há elemento DOM para cada árvore, nova consulta por pan/zoom ou alteração da estratégia de cache. Sobreposições podem encobrir árvores coincidentes; essa limitação permanece sem criar um novo fluxo de seleção.

## Validação

Os testes de UX usam 390, 1440 e 1920px e conferem largura total, filtros, legenda, ausência de clusters na escala de bairro, quatro páginas iniciais para 1.914 registros, ausência de novas consultas/`setData` ao navegar e persistência da dispensa da instalação. Os testes botânicos verificam contador, paletas, expansão por teclado e seleção da árvore. Fixtures ficam somente no ambiente de testes.

Resultado final: 21 testes unitários e 15 testes de ponta a ponta aprovados. Lint sem avisos, TypeScript e build de produção aprovados.

Revisão em produção, Chrome headless, Supabase e MapTiler reais, em 27/09/2026:

| Largura | Primeira consulta | Conjunto completo | Marcadores desde a navegação |
| ------- | ----------------- | ----------------- | ---------------------------- |
| 1440px  | 1.790ms           | 2.328ms           | 3.636ms                      |
| 1920px  | 857ms             | 1.376ms           | 2.441ms                      |
| 390px   | 627ms             | 1.076ms           | 2.074ms                      |

Cada largura carregou as 1.914 árvores em quatro páginas iniciais, com 1.638.038 bytes de JSON (aproximadamente 1,64MB). Pan/zoom não geraram consultas de árvores nem `setData`; filtros não geraram consultas de árvores. Os tiles do mapa-base continuam sendo carregados normalmente conforme a navegação. Os tempos de rede variam entre execuções.

Na abertura em zoom 12,4 e após aproximar para 13,4, o contador de clusters visíveis foi zero. Ao afastar para 11,4, foram observados 38 clusters em cada largura; isso não representa 38 árvores, mas 38 agrupamentos visíveis, além dos pontos isolados. Não houve erro de JavaScript, aviso de mapa indisponível ou overflow horizontal. A mediana dos intervalos de `requestAnimationFrame` durante o pan ficou em 6,9–7ms, com p95 de 7–7,1ms no ambiente automatizado; esse indicador não é um benchmark de FPS em aparelhos físicos.

Capturas iniciais: [1440px](validacao/refinamento-mapa-real-1440.png), [1920px](validacao/refinamento-mapa-real-1920.png) e [390px](validacao/refinamento-mapa-real-390.png). Capturas de bairro, zoom distante e filtro branco usam os sufixos `bairro`, `distante` e `brancos`. Resultados completos estão em [metricas-refinamento-mapa.json](validacao/metricas-refinamento-mapa.json).

Revisão real e medições: executar `npm run build` e `node scripts/map-performance-review.mjs --production --refinement`, usando Node 22. As capturas dessa rodada recebem o prefixo `refinamento-mapa`, preservando as medições históricas da rodada anterior.

## Possíveis ajustes posteriores

Comparar raio 20 com 28px usando a mesma região e zoom; ajustar o tamanho intermediário das copas em telas pequenas; variar ligeiramente a forma dos três bosques por faixa de contagem; calibrar contraste de avenidas e parques em aparelhos físicos. Essas mudanças podem ser feitas apenas na apresentação, sem alterar coordenadas ou classificações cadastrais.
