# Validação

A composição e a diferenciação por verificação atuais estão em [HIERARQUIA_VISUAL_MAPA.md](../HIERARQUIA_VISUAL_MAPA.md). Capturas reais usam `hierarquia-mapa-*`; as fixtures de UX misturam municipais não verificados e verificados somente no navegador de testes.

A revisão visual mais recente está em [REFINAMENTO_VISUAL_MAPA.md](../REFINAMENTO_VISUAL_MAPA.md). Suas capturas usam o prefixo `refinamento-mapa`; os arquivos `ux-mapa-real-*` e `metricas-mapa.json` registram a rodada anterior.

A rodada exclusiva de UX/performance foi revisada em 390, 1440 e 1920px. As capturas `ux-mapa-real-*` usam Dataviz Light personalizado e o cadastro real, com layout desktop em tela cheia. `metricas-mapa.json` contém tempos, bytes e checks de consultas únicas/`setData`; `contraste-marcadores.svg` mostra as quatro cores e selos sobre os fundos do mapa. O relatório atual está em [UX_MAPA_PERFORMANCE.md](../UX_MAPA_PERFORMANCE.md).

O mapa botânico possui SVGs próprios para árvores individuais e clusters, com contador, filtro de cor e expansão por clique/teclado. Capturas `mapa-botanico-real-mobile.png` e `mapa-botanico-real-desktop.png` usam o cadastro municipal e o mapa real; a revisão não encontrou erros de JavaScript, aviso de mapa indisponível ou overflow. Capturas `mapa-botanico-*` sem “real” usam fixtures exclusivamente no navegador e tiles de teste. Implementação, performance e ajustes estão em [MAPA_BOTANICO.md](../MAPA_BOTANICO.md).

O fluxo de cadastro municipal foi validado em mobile e desktop: selo de existência não verificada, CTA, bloqueio de associação acima de 10m, envio pendente, aprovação fotográfica, preservação da origem e da cor cadastral e exclusão de fotografia antiga do filtro de floração recente. Capturas `cadastro-municipal-mobile.png` e `cadastro-municipal-desktop.png` usam candidatos e imagens sintéticas **somente no backend local de testes**. A importação real contém 1.914 candidatos e zero fotografias/observações; a API pública e a reexecução idempotente foram verificadas, conforme [o relatório de execução](../prefeitura-goiania/EXECUCAO_IMPORTACAO.md).

Capturas `home-mobile.png` (390 × 844) e `home-desktop.png` (1440 × 1000) usam o banco local vazio e tiles reais OpenStreetMap. Estatísticas zero são reais desse ambiente. Referência de produto: imagem original na raiz. O script `scripts/visual-review.mjs` reproduz as capturas com servidor local na porta 3000; no ambiente avaliado não houve overflow horizontal nem erros de console.

Playwright usa ambiente separado na porta 3100 e imagens geradas **somente para testes**, nunca mostradas na aplicação padrão. Testa cadastro, privacidade de pendentes, moderação/aprovação, galeria, histórico antigo com EXIF, associação à mesma árvore, clusters e seleção no mapa, rejeição, origem estrangeira, ausência de autorização, GPS negado, ponto manual, validação e recursos de instalação.

Testes unitários conferem validação, datas históricas, distância, persistência/moderação e hash, imagens otimizadas/EXIF privado e sintaxe SQL/PLpgSQL. O teste do parser substitui somente tipos customizados em declarações PLpgSQL porque não possui um catálogo de banco. Não executa a migration nem valida a semântica PostGIS/RLS; a verificação real depende de homologação com Supabase e Supabase Storage.

Guia e privacidade precisam de revisão editorial antes de receber público. GPS real, câmera em aparelhos iOS/Android, contas externas e deploy ainda devem ser validados pelo responsável. A PWA não tem mapa ou cadastro offline.
