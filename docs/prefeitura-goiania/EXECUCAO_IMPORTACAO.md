# Execução da importação municipal

Importação transacional concluída. Verificação READ ONLY e via API anônima: 2026-09-26T23:56:37.085Z.

Reexecução verificada com o mesmo snapshot e plano: **0 inserts, 0 updates, nenhuma gravação no banco**. A evidência inicial foi preservada em resultado-primeira-execucao.json e o resultado idempotente em resultado.json, na pasta privada local do lote.

- **1.914 árvores**, apenas camada Árvore (3), códigos autorizados.
- **1.914 cadastros de origem** e **1.914 versões históricas**.
- Todas em **CADASTRO_PUBLICO**, moderação **PENDENTE**, verificação **NAO_VERIFICADA**.
- **0 observações**, **0 fotografias**, **0 árvores floridas**.
- Geometria original **EPSG:31982** e aplicação **EPSG:4326** em todos os registros.
- API pública retornou **1.914 UUIDs distintos** em quatro páginas; ficha pública sem fotografia funciona; filtro de floração retorna vazio.

O [plano anterior à execução](PLANO_IMPORTACAO.md) foi apresentado antes da gravação e mantido como evidência. A migration 202609260003 e o lote foram aplicados numa única transação. Respostas originais, snapshot, primeira execução e verificação detalhada estão em .local-data/importacao-prefeitura/, ignorados pelo Git.

Testes: 16 unitários passaram, incluindo parsing SQL/PLpgSQL e paginação; fluxo municipal de foto/moderação/proveniência passou em mobile e desktop; oito testes anteriores de navegador passaram; lint, TypeScript e build passaram. Os testes de envio usaram somente fixtures no backend local. Nenhuma foto ou observação de teste foi enviada ao Supabase nesta importação.

Os **1.387 pares até 10m**, incluindo **34 até 2m**, são alertas de associação, não fusões; nenhum par tem coordenadas idênticas. Nenhuma origem histórica foi apagada. Consulte [o procedimento reproduzível](IMPORTACAO.md).
