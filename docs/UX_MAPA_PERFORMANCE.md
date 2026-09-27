# Rodada de UX, mapa e performance

Este documento registra a rodada anterior e suas medições. A revisão visual mais recente, com header de 72px e agrupamentos menores, está em [REFINAMENTO_VISUAL_MAPA.md](REFINAMENTO_VISUAL_MAPA.md).

Rodada limitada à apresentação e ao carregamento do mapa. Não foram alterados banco, migrations, regras de publicação/validação, proveniência municipal, associação de observações ou fluxo de registro. As consultas de revisão ao ambiente real foram somente de leitura.

## Layout

Em desktop, o mapa ocupa `100vw × calc(100dvh - 88px)`, abaixo do header: sem margens externas, borda ou arredondamento de card. Filtros, título/estatísticas e árvore selecionada são painéis sobre o mapa. O painel de estatísticas fica no canto inferior esquerdo; a ficha selecionada flutua à direita. Conteúdo secundário da home fica oculto no desktop para que a página seja a área de trabalho do mapa.

Em 390px, a estrutura mapa + bottom sheet e a navegação inferior foram preservadas. O header tem 76px e inclui um menu compacto.

Capturas reais: [1440px](validacao/ux-mapa-real-1440.png), [1920px](validacao/ux-mapa-real-1920.png), [390px](validacao/ux-mapa-real-390.png). As capturas `ux-mapa-*.png` sem “real” usam fixtures no navegador e tiles de teste.

## Carregamento único

`src/lib/map-dataset.ts` mantém uma promessa compartilhada por sessão da página, inclusive entre efeitos repetidos no desenvolvimento. O conjunto público inteiro é carregado no início. A API existente permite até 500 linhas por resposta: são quatro páginas para as 1.914 árvores, e não 1.914 chamadas. A primeira página e a contagem pública iniciam juntas; as três páginas restantes são carregadas em paralelo. A contagem de estatísticas é reaproveitada pelo painel, sem uma chamada adicional duplicada. Uma contagem desatualizada não trunca páginas completas: o carregador continua buscando até terminar o conjunto.

Busca, cor, espécie, confiança, data e filtro de florada são aplicados localmente. Os filtros de data/florada continuam usando observações públicas reais e o mesmo cálculo de florada recente; a cor cadastral não produz uma observação ou estado de florada.

O MapLibre recebe GeoJSON compacto com coordenadas, ID e ícone. A clusterização ocorre no worker nativo. O GeoJSON é memoizado: pan, zoom, contagem da janela e abertura de painéis não chamam `setData`. Uma mudança efetiva de filtro substitui o subconjunto e recalcula clusters, sem rede. A lista e o contador de árvores visíveis usam a geometria local; não disparam consultas por viewport.

O snapshot permanece em memória até recarregar a página. Cadastros ou aprovações feitos depois de seu carregamento aparecem no próximo carregamento da página. Não foi adicionado polling, botão de atualização ou persistência de registros em `localStorage`/service worker.

## Medições reais

Medição em 26/09/2026, 22:19 BRT, build de produção local, Chrome headless no Windows, rede real para Supabase e MapTiler. Cada largura abriu um contexto novo do navegador. Não representa uma medição em aparelho Android/iOS físico. O servidor e serviços externos podem aproveitar caches entre medições, portanto as diferenças entre larguras não são atribuíveis somente ao layout.

| Janela      | Primeira consulta de árvores | Conjunto completo | Primeiro marcador desde navegação | Primeiro marcador desde início da consulta |
| ----------- | ---------------------------: | ----------------: | --------------------------------: | -----------------------------------------: |
| 1440 × 1000 |                     2.059 ms |          3.246 ms |                          3.654 ms |                                   3.364 ms |
| 1920 × 1080 |                     1.202 ms |          1.668 ms |                          2.534 ms |                                   2.256 ms |
| 390 × 844   |                     1.132 ms |          2.128 ms |                          2.501 ms |                                   2.205 ms |

A primeira consulta mede requisição/resposta da página inicial, incluindo processamento e entrega; não é o tempo isolado de execução SQL. O tempo do conjunto inclui as quatro respostas, parsing e montagem do snapshot. O primeiro marcador é marcado no frame em que um cluster é colocado no DOM ou um símbolo individual está disponível na renderização. Inclui preparação do mapa-base e ícones; o script também verifica sua presença visual.

Payload das quatro páginas, em todas as larguras: **1.638.038 bytes de corpo JSON (1,64 MB decimal / 1,56 MiB)**; **1.639.238 bytes transferidos**, incluindo o overhead contabilizado pelo navegador. Corpo codificado e decodificado tiveram o mesmo tamanho nessa execução local. Não foram somados tiles, fontes, sprites ou JavaScript do mapa-base a esse payload de árvores.

| Check após carregamento                     | 1440px | 1920px |   390px |
| ------------------------------------------- | -----: | -----: | ------: |
| Novas consultas de árvores durante pan/zoom |      0 |      0 |       0 |
| `setData` durante pan/zoom                  |      0 |      0 |       0 |
| Novas consultas por troca de cor            |      0 |      0 |       0 |
| Intervalo mediano de frames no gesto de pan | 7,0 ms | 7,0 ms |  6,9 ms |
| P95 dos intervalos no gesto de pan          | 7,1 ms | 7,1 ms | 20,8 ms |

Intervalos de `requestAnimationFrame` são um indicador de regularidade no ambiente headless, não FPS garantido em aparelhos físicos nem medição de latência de toque. A navegação não exibe “Buscando registros” novamente. Tiles do **mapa-base** ainda podem ser solicitados ao MapTiler durante movimentos; isso não provoca uma consulta de árvores ao Supabase.

Na inicialização houve uma chamada a `setData` em 1440/390px e nenhuma em 1920px: nesse último caso o snapshot já estava pronto quando a fonte foi adicionada. Todas as versões carregaram as mesmas 1.914 árvores. Não houve erro de JavaScript, aviso de mapa indisponível ou overflow horizontal nas revisões.

Dados completos: [metricas-mapa.json](validacao/metricas-mapa.json).

## Mapa-base e contraste

O estilo passa a ser **MapTiler Dataviz v4 Light**, com personalização em `src/lib/map-basemap.ts`: fundo off-white, vias neutras, parques/vegetação verde suave, água pastel, labels menos contrastantes e sem ícones de comércio. Foram preservados nomes de ruas/bairros e adicionadas representações discretas de córregos e nomes de parques/água disponíveis nos tiles.

Sem chave MapTiler, o fallback continua usando tiles raster OSM, agora dessaturados. Nesse fallback a aplicação não consegue remover seletivamente POIs de imagens raster; a revisão real utiliza o estilo vetorial Dataviz personalizado.

Os SVGs botânicos foram mantidos e ganharam contornos mais definidos. O ipê branco usa creme com outline verde escuro. As árvores têm opacidade integral. Cadastro municipal usa pequeno selo vazado com folha; confirmação comunitária usa selo preenchido com check. Os selos distinguem o status sem mudar a cor do tipo de árvore. A legenda mantém: **“Cor indica o tipo de ipê; não a florada atual.”**

| Contorno × cor plana do mapa | Amarelo |   Rosa |   Roxo | Branco |
| ---------------------------- | ------: | -----: | -----: | -----: |
| Fundo                        |  4,20:1 | 7,50:1 | 8,95:1 | 8,63:1 |
| Parques                      |  3,80:1 | 6,78:1 | 8,09:1 | 7,80:1 |
| Água                         |  3,57:1 | 6,38:1 | 7,61:1 | 7,34:1 |

Esses valores são do contorno, não da copa inteira ou de todo conteúdo do mapa. A revisão visual inclui símbolos municipais e comunitários a 32/48px em [contraste-marcadores.svg](validacao/contraste-marcadores.svg), além de capturas reais do filtro branco em [1440px](validacao/ux-mapa-brancos-1440.png), [1920px](validacao/ux-mapa-brancos-1920.png) e [390px](validacao/ux-mapa-brancos-390.png).

Referência do estilo: [MapTiler Dataviz Light](https://www.maptiler.com/maps/light/). O identificador atual é `dataviz-v4-light`; a [documentação do MapTiler](https://docs.maptiler.com/sdk-js/api-reference/variables/Externals.MAP_STYLE_CONFIG/) indica a substituição do antigo `dataviz-light`.

## Instalação

O botão flutuante foi removido. A oferta de instalação, quando o navegador a disponibiliza, aparece como controle pequeno no menu do header, também no mobile. Não há prompt automático. O usuário pode dispensá-la pelo X; aceitar ou recusar o prompt também persiste a preferência na chave `ipes:install-choice`. O evento de instalação concluída registra a escolha e remove a oferta. A escolha permanece nas recargas quando `localStorage` está disponível.

## Limites e evolução

A camada de transporte (`loadMapDataset`) fica separada dos filtros e do renderizador (`CityMap`). Com o crescimento do conjunto, essa separação permite substituir o carregamento integral por tiles vetoriais ou consultas por viewport e buscar a ficha de uma árvore sob demanda. A estratégia atual mantém o limite existente de 5.000 registros do carregador; a interface indica quando esse limite é atingido. Para as 1.914 árvores atuais não há truncamento.

O custo atual é manter o JSON público e GeoJSON em memória, além de um atlas finito de ícones. Os clusters HTML são reconciliados durante movimentos para evitar que apareçam apenas ao soltar o pan; os SVGs e botões existentes são reaproveitados. A lista usa `content-visibility` para reduzir trabalho de pintura em cards fora de sua janela.

## Reproduzir

Com Node compatível com `package.json`:

```powershell
npm run build
npm run map:measure
node scripts/map-contrast-review.mjs
```

`map:measure` inicia um servidor temporário na porta 3200, usa somente GET no cadastro real e o encerra ao terminar. `REVIEW_URL` pode ser usado com `node scripts/map-performance-review.mjs` para revisar um servidor já em execução. Não use `--production` junto de um processo próprio já ocupando a porta 3200.

Testes de UX: `tests/e2e/map-ux.spec.ts`, com 390px, 1440px e 1920px. Eles verificam carregamento único, ausência de `setData` durante navegação, filtros/clusters, dimensões, ausência de loading e persistência da dispensa de instalação. Os testes botânicos e os fluxos existentes de registro/moderação também foram executados. Todos usam fixtures locais/de navegador para escritas; o ambiente real é utilizado somente na revisão de leitura.

Resultado final: **21 testes unitários e 15 casos de ponta a ponta aprovados** (cinco de mapa/UX e dez fluxos existentes), além de lint, TypeScript e build de produção. Um timeout de inicialização do servidor de testes em execução simultânea com outras verificações foi resolvido pela reexecução isolada; os cinco casos de mapa/UX passaram nessa reexecução.
