# Importação de inventários

A base pública municipal de Goiânia foi investigada e os 1.914 candidatos aprovados foram importados como cadastro público não verificado. Consulte [o relatório da investigação](../../docs/prefeitura-goiania/RELATORIO_INVESTIGACAO.md), [a execução](../../docs/prefeitura-goiania/EXECUCAO_IMPORTACAO.md) e [o script da investigação](../investigacao/README.md). A arquitetura permite espécies e campanhas além dos ipês.

A importação aprovada está preparada em [prefeitura-goiania.mjs](./prefeitura-goiania.mjs). Veja [o procedimento e o plano](../../docs/prefeitura-goiania/IMPORTACAO.md): preparar snapshot, simular com `--plan` em READ ONLY, revisar e somente depois executar `--apply --approved-plan HASH`. O lote inclui apenas os 1.914 candidatos da camada Árvore, com proveniência preservada e sem confirmação, observação, fotografia ou floração inventadas.

Quando uma fonte legítima estiver disponível, confira licença, origem, sistema de coordenadas e data do levantamento. Normalize coordenadas para WGS84 / EPSG:4326. Separe a entidade árvore das observações temporais. Dados de um inventário sem fotografia não devem fingir ser observações fotográficas da campanha.

Use `validar.mjs caminho.csv` para conferir um CSV com cabeçalho `id_origem,latitude,longitude,nome_popular,data_levantamento`. Este utilitário apenas valida; não escreve no banco. Uma futura importação deve registrar proveniência, evitar duplicatas com PostGIS, entrar em uma campanha própria e passar por revisão. Teste primeiro em ambiente de homologação.
