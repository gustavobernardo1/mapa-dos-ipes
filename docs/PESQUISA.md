# Ciência cidadã e pesquisa

Sua foto → árvore localizada → histórico da floração → série temporal de satélite → pesquisa → possíveis novos candidatos → validação pela comunidade.

Cada fotografia fornece referência espacial e temporal. Registros poderão futuramente ser comparados com séries temporais de imagens de satélite para investigar padrões de floração detectáveis remotamente. Isso é uma hipótese de pesquisa, não uma funcionalidade pronta.

O banco conecta árvore, observação, foto, data, coordenada, fenologia, confiança e classificações humanas. `classificacoes` prepara modelos/versionamento futuros. Uma série temporal poderá se relacionar à árvore por seu UUID em futuras tabelas específicas. Não existe classificação automática implementada.

Critérios de dataset devem ser separados da aprovação para galeria: verificar localização da copa, precisão GPS, data original e declarada, proveniência e licença, fenologia e determinação botânica, incluindo incerteza de cada componente. EXIF pode ser alterado; ter EXIF não prova autenticidade. O nível de confiança é atribuído pelo moderador, não por um percentual fabricado.

Base em `research/sentinel2_exploracao.ipynb`: consulta STAC opcional, B04/B08/SCL, máscara de nuvens, calibração e NDVI exploratório. Não há saídas calculadas nem coordenadas falsas. Veja `research/README.md` para dependências e limitações.

Curto prazo: dados reais e protocolo de revisão. Próxima temporada: revisitas, séries fenológicas, campanhas e controles. Sensoriamento remoto: qualidade de pixels mistos, resolução, bandas, calibração, sazonalidade, controles e validação independente. Possíveis candidatos exigem visita de campo. Nenhuma detecção automática ou previsão de florada deve ser anunciada.
