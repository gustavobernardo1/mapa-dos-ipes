# Pesquisa futura

Pergunta inicial: **A floração dos ipês urbanos produz uma assinatura detectável nas séries temporais Sentinel-2?**

O notebook `sentinel2_exploracao.ipynb` é uma base exploratória, sem resultados nem modelo integrado ao produto. Não foi executado com dados reais. A consulta é desativada até a configuração explícita de uma árvore confirmada e período.

Em ambiente Python isolado:

```sh
python -m venv .venv
pip install -r research/requirements.txt
jupyter notebook research/sentinel2_exploracao.ipynb
```

Selecione registros verificados e obtenha permissão para o uso. Não use EXIF privado como exportação pública. Verifique qualidade temporal e espacial separadamente da determinação botânica; fotos históricas podem conter metadados alterados.

O exemplo consulta o catálogo STAC Microsoft Planetary Computer, filtra cenas, aplica a máscara SCL, extrai B04/B08 e calcula NDVI. O filtro por percentual de nuvem da cena não garante um pixel limpo. A amostragem é em pixels de 10 m: copas individuais, sombra, solo, construções e árvores vizinhas podem se misturar. NDVI não comprova floração nem identifica espécie.

Próximos estudos: comparar árvores confirmadas com controles, testar bandas adicionais e outras métricas, avaliar resolução, registrar versão das fontes, incerteza, mudanças de processamento e métodos. Separar treino/avaliação por árvore, local e temporada para evitar vazamento. Candidatos exigem validação de campo; nenhuma detecção é apresentada como pronta.

Referências oficiais: [Sentinel-2](https://dataspace.copernicus.eu/explore-data/data-collections/sentinel-data/sentinel-2), [STAC](https://stacspec.org/), [Planetary Computer Sentinel-2](https://planetarycomputer.microsoft.com/dataset/sentinel-2-l2a).
