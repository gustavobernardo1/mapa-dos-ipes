# Metodologia do guia

Os sete grupos foram escolhidos pelo pedido do projeto e pela necessidade de distinguir árvores amarelas semelhantes. Fichas de grupos populares usam um táxon de referência explícito. Não extrapolamos sua descrição para todas as espécies do grupo.

Taxonomia: prioridade Flora e Funga do Brasil / JBRJ. Monografias de Cenostigma e Cassia foram consultadas diretamente. A lista oficial do mesmo publicador foi consultada pela API GBIF com datasetKey fixo, correspondência exata de canonicalName e leitura de taxonomicStatus; não usamos o backbone geral do GBIF. Registros, IDs e consulta estão em [snapshot](../../research/guia/taxonomia-flora-gbif.json). Esta é uma fotografia da versão distribuída, não garantia de sincronização imediata com o portal. Reconciliação nomenclatural e identificação individual continuam sujeitas a revisão botânica.

Caracteres: Embrapa, flora regional publicada e documentos institucionais. Cada fato contém IDs de fontes; todo campo sem sustentação disponível foi marcado como pendente. Referências geográficas acompanham alturas e meses: calendário de Pernambuco ou Índia não vira calendário de Goiânia. Duração não foi estimada. Descrição municipal não foi usada como prova de taxonomia de indivíduos.

Comparações: reutilizam os mesmos fatos das fichas, sem introduzir características exclusivas. Amarelo × três semelhantes compara flor, disposição, folhas, casca, porte, copa, fruto, folhagem e época. Rosa × roxo compara dois exemplos com aviso de sobreposição; cinco folíolos aparecem em ambos. Branco × T. elliptica usa a comparação explícita do tratamento de Pernambuco, sem alegar ocorrência de T. elliptica em Goiânia. Sua fotografia ficou pendente.

Imagens: busca em Wikimedia Commons; verificação individual de autoria, licença, descrição e tipo de órgão. [Evidência de metadados](../../research/guia/imagens-selecionadas.json) preserva os campos originais da API. As imagens foram inspecionadas visualmente; a identificação declarada pelo repositório não substitui confirmação por especialista. Uma foto de copa não foi descrita como detalhe de folha. Nenhuma foto é atribuída a árvores municipais. Não corrigimos cores para forçar distinção rosa/roxo.

Conversão: resolução máxima de 1280 × 1280, proporção preservada, WebP qualidade 82. Enquadramento de apresentação pode recortar; crédito registra a alteração. Hash SHA-256 e tamanho dos derivados no manifesto. Manter licença BY-SA dos dois derivados correspondentes.

Fontes adicionais investigadas: páginas institucionais e PDFs têm imagens úteis, mas atribuição textual não é autorização. iNaturalist foi examinado como alternativa via [ajuda oficial](https://www.inaturalist.org/pages/help); licença de observação e licença de foto devem ser verificadas separadamente. Nenhuma imagem iNaturalist foi adotada nesta rodada. Fontes do JBRJ foram usadas para fatos, sem extrair fotos cuja licença individual não foi comprovada. Não houve pedido de autorização nem contato com autores.

Revisão: [lista objetiva](REVISAO_PENDENTE.md). Relação com ciência cidadã em [metodologia geral](../metodologia/05-ciencia-cidada.md).

Apresentação: reconhecimento visual → pistas rápidas → comparação → informação botânica completa → fontes e metodologia. A entrada usa cards com links para fichas próprias; comparador, fotografia e fontes têm páginas dedicadas. Detalhes e tabelas começam recolhidos, sem retirar conteúdo ou referências. A refatoração não altera taxonomia, evidências, licenças ou regras do mapa. Decisões em [arquitetura de informação](ARQUITETURA_INFORMACAO.md).
