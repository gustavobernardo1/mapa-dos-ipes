# Investigação da arborização pública de Goiânia

Consulta iniciada: **2026-09-26T22:15:41.045Z**. Fonte: [serviço municipal](https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer), [Árvore](https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer/3), [dicionário oficial](https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/ARV%20CDESPECIE.htm) e [documentação da entidade](https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/Arv.htm). Respostas originais, horários, parâmetros e SHA-256: [consultas.json](../../data/prefeitura/consultas.json). Apenas fontes públicas da Prefeitura; nenhuma escrita em banco.

## Respostas objetivas

1. **Há árvores individuais?** Sim: a camada Árvore tem feições pontuais com OBJECTID e id, compatíveis com cadastros individuais. Isso não comprova que cada ponto corresponda a uma árvore ainda existente.
2. **Quantas?** 90.172 registros, por returnCountOnly. O extent espacial é parcial; não é o total de árvores da cidade.
3. **É possível identificar ipês?** Sim, como candidatos cadastrais, cruzando cdespecie com o dicionário municipal. nm contém códigos, não nomes.
4. **Quantos possíveis ipês?** 1.914, sem incluir Tecoma stans/ipê-de-jardim. Contagem verificada tanto por query específica quanto pela soma dos grupos.
5. **Como são nomeados?**

| Código | Nome municipal | Científico municipal | Registros |
|---:|---|---|---:|
| 16 | Ipê-roxo | Tabebuia impetiginosa | 708 |
| 36 | Ipê-amarelo vellosoi | Tabebuia vellosoi | 174 |
| 118 | Ipê-amarelo-do-cerrado,taipoca | Tabebuia chrysotricha | 150 |
| 119 | Ipê-rosa | Tabebuia rosea | 462 |
| 166 | Ipê-Branco | Tabebuia roseo-alba | 45 |
| 175 | Ipê-amarelo | Tabebuia serratifolia | 335 |
| 176 | Ipê-roxo-de-sete-folhas | Tabebuia heptaphylla | 39 |
| 306 | Ipê-caraíba | Tabebuia aurea (Manso) | 1 |

6. **Cores distinguíveis?** Somente as explícitas nos nomes: ROXO: 747; AMARELO: 659; ROSA: 462; BRANCO: 45; NAO_INFORMADA: 1. A classificação é textual, não observação de floração nem validação taxonômica.
7. **Atributos úteis?** Porte (inporte/porte), idade (inidade/idade), condição (incondarv), diâmetro da copa (indiamcopa/dpc), CAP (incap/cap), poda, interferências, observações, bairro (cdbairro), levantamento/cadastro/atualização/plantio. Duas famílias de campos antigas/novas não devem ser fundidas automaticamente; códigos, unidades e datas precisam de validação. Bairro é código sem domínio REST; não inventar nomes.
8. **Coordenadas?** Global: 0 geometrias nulas; 90.172 registros com ambos os atributos x/y não nulos; 0 com x ou y zero; 90.172 (100%) geometrias dentro do envelope WGS84 numericamente válido da camada. Contenção municipal **aproximada**, no polígono oficial generalizado a 0.0001 grau (~11m), precisão 6 casas: 90.172 dentro/intersectando (100%), 0 não nulos fora. Nos candidatos: 1.914/1.914 dentro pelo mesmo método. Amostra: 45/45 pontos WGS84 numericamente válidos (100%), 0 fora do polígono municipal **original**. Estar dentro do município não mede precisão de posicionamento, deslocamento de projeção ou existência atual.
9. **Limitações?** Dicionário HTML legado sem versão/data; 331 registros com códigos não zero sem descrição; 8.709 sem classificação; ausência de domínio REST e de nomes científicos na camada; cobertura territorial parcial; campos paralelos/valores sentinela; ausência de confirmação recente em campo e de licença explícita no metadata (copyrightText: ""). A amostra é dirigida por código/OBJECTID, não aleatória. Não se auditou a duplicidade de toda a base.
10. **Adequada para inicializar o Mapa dos Ipês?** Sim como catálogo municipal de candidatos para revisão e planejamento, condicionado à confirmação do vínculo/atualidade do dicionário e das condições de reutilização. Não é adequada para apresentar automaticamente árvores como confirmadas pela comunidade. Não importar ainda.
11. **Estratégia segura?** Criar primeiro um lote de homologação/quarentena, guardar snapshot e chaves de origem, comparar geometria com árvores existentes usando proximidade como alerta, revisar casos sem descrição, preservar atributos brutos e só publicar em categoria explícita de cadastro público. Não fabricar fotografias, observações, floração ou aprovação comunitária. A data técnica de edição não equivale à vistoria.
12. **O que não é verdade científica sem campo?** Identidade botânica individual, sinonímia atual, cor/floração efetiva, condição/saúde, medidas/unidades, idade, existência atual, autoria de vistoria e precisão dos pontos. O nome do dicionário é uma descrição cadastral.

## Completude global

Nome nm preenchido: 90.172 (100%), mas são códigos textuais. Nome descritivo recuperável pelo dicionário, excluindo código 0/nulo: 81.132 (89.975%). Sem classificação (0/nulo): 8.709 (9.658%). Código não zero sem descrição é uma categoria separada: 331 (0.367%). Estes denominadores são os 90.172 registros da camada Árvore.

| Campo | Não nulos | Brancos | Não vazios | % do total | Mínimo | Máximo |
|---|---:|---:|---:|---:|---|---|
| inporte | 90.172 | 8.656 | 81.516 | 90.401 | — | — |
| incondarv | 90.172 | 8.656 | 81.516 | 90.401 | — | — |
| indiamcopa | 90.172 | 8.658 | 81.514 | 90.398 | — | — |
| incap | 90.172 | 8.656 | 81.516 | 90.401 | — | — |
| inidade | 90.172 | 8.656 | 81.516 | 90.401 | — | — |
| poda | 90.172 | 88.958 | 1.214 | 1.346 | — | — |
| porte | 90.172 | 51.657 | 38.515 | 42.713 | — | — |
| idade | 90.172 | 51.656 | 38.516 | 42.714 | — | — |
| cap | 90.172 | 0 | 90.172 | 100 | — | — |
| dpc | 90.172 | 0 | 90.172 | 100 | — | — |
| cdbairro | 90.172 | 0 | 90.172 | 100 | — | — |
| dtlevanta | 90.172 | 8.656 | 81.516 | 90.401 | — | — |
| dtplantio | 0 | 0 | 0 | 0 | — | — |
| dtcadastro | 66.024 | 0 | 66.024 | 73.22 | 1909-08-05T00:00:00.000Z | 1997-10-25T00:00:00.000Z |
| dtatualiza | 0 | 0 | 0 | 0 | — | — |
| created_date | 0 | 0 | 0 | 0 | — | — |
| last_edited_date | 1 | 0 | 1 | 0.001 | 2024-09-23T17:38:10.000Z | 2024-09-23T17:38:10.000Z |
| observacao | 90.172 | 70.329 | 19.843 | 22.006 | — | — |
| inobs | 90.172 | 8.657 | 81.515 | 90.399 | — | — |
| instatus | 90.172 | 24.087 | 66.085 | 73.288 | — | — |
| cdtparvore | 90.172 | 0 | 90.172 | 100 | — | — |
| x_coord | 90.172 | 0 | 90.172 | 100 | 678813.52 | 689745.82 |
| y_coord | 90.172 | 0 | 90.172 | 100 | 8149321.92987 | 8159769.196 |

Branco = comparação SQL com '' ou ' ' no servidor; outros sentinelas e strings de múltiplos espaços não reconhecidas pela comparação não são somados a branco. TRIM não é aceito por este serviço. Valores como '-', 'Number Null', 0 e códigos de categoria não são automaticamente informação válida. Datas numéricas são milissegundos ArcGIS; extremos e distribuições brutas estão em [qualidade.json](../../data/prefeitura/qualidade.json). dtlevanta não foi convertido sem regra confirmada. As contagens por bairro constam em [ipes_resumo.json](../../data/prefeitura/ipes_resumo.json); bairros continuam códigos.

## Amostra e suspeitas

[GeoJSON de 45 candidatos](../../data/prefeitura/ipes_amostra.geojson), solicitado com f=geojson, outSR=4326, returnGeometry=true, outFields=*. Atributos originais preservados; nenhuma classificação adicional inserida nas propriedades. 0 pares com coordenadas idênticas e 2 pares a até 5m **na amostra**. Proximidade não comprova duplicação; não se extrapolam essas contagens para todos os candidatos. Detalhes de IDs/distâncias, vazios por campo e 0 datas fora da faixa 1900–consulta+1dia estão no JSON de qualidade. Ausência de suspeitas na amostra não comprova qualidade global.

**Alerta global de datas:** dtcadastro vai de 1909-08-05T00:00:00.000Z a 1997-10-25T00:00:00.000Z, com 66.024 valores. O extremo mais antigo merece revisão, e a faixa de cadastro é histórica; não presumir que os pontos representam árvores presentes hoje. dtatualiza e dtplantio estão integralmente nulos na Árvore. A data técnica de edição isolada não atualiza a vistoria de toda a base. Estes alertas globais são distintos do teste de datas da amostra.

## Plantio, separado

[Camada 4](https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer/4): Plantio, esriGeometryPoint, 107 campos, 30.694 registros. Código de espécie 0 em 30.676 registros; nenhum dos oito códigos de candidatos aparece nas estatísticas dessa camada. dtplantio está integralmente nulo. Distribuição de instatus: [{"instatus":" ","n":9430},{"instatus":"P","n":10751},{"instatus":"V","n":10513}]. Distribuição na Árvore: [{"instatus":" ","n":24087},{"instatus":"P","n":27306},{"instatus":"V","n":38779}]. Nomes da camada/valores de status não comprovam plantio executado nem árvore adulta/existente. Foram examinados metadata, estatísticas, datas e 5 registros sem geometria. Os mesmos números de OBJECTID foram consultados na Árvore apenas para comparação; OBJECTID é local a cada camada e pode coincidir sem representar a mesma entidade. Não houve união nem soma ao total de candidatos. Não foi estimada sobreposição global. Veja respostas e comparação em qualidade.json.

## Proposta de proveniência — sem alteração de schema

`fonte=PREFEITURA_GOIANIA`; `fonte_dataset=MAPA_MEIO_AMBIENTE`; `fonte_layer=ARVORE`; `fonte_layer_id=3`; `fonte_object_id=OBJECTID`; `fonte_id_secundario=id`; `fonte_data_consulta=timestamp UTC`; `fonte_url`; `fonte_snapshot_sha256`; `fonte_codigo_especie=cdespecie`; `fonte_descricao_original`; `fonte_dicionario_url/sha256`; `fonte_atributos_originais`; `status_validacao=CADASTRO_PUBLICO`. A chave técnica composta inclui fonte+dataset+camada+OBJECTID; verificar estabilidade dos IDs entre versões antes de usar upsert. Guarda separada para geometria original EPSG:31982 e transformada EPSG:4326; versão do lote e decisões de revisão rastreáveis. Código e descrição cadastral separados de identificação botânica validada. Este status expressa origem cadastral, sem equivaler a aprovação comunitária.

## Reproduzir e auditar

Ver [instruções do script](../../scripts/investigacao/README.md). São consultas sequenciais com intervalo mínimo de 400ms, páginas de no máximo 1000, timeout 45s, até 3 tentativas em falhas de transporte/HTTP 429/5xx e interrupção explícita em erro ArcGIS/metadata inesperado. O snapshot inclui todos os parâmetros e bytes, com SHA-256. Não é transação: alterações durante as consultas podem gerar diferenças; verificações de soma detectam parte desse risco. Nenhuma descarga integral de feições foi feita. Só 45 geometrias de árvores, limites municipais e 5 atributos de Plantio nesta execução. A exploração prévia também preservou uma pequena prova de GeoJSON. Arquivos iniciais de exploração foram mantidos em evidencias/.

O envio do polígono municipal completo (4129 vértices) retornou HTTP 500, inclusive após retry. O envelope da camada não está integralmente contido no limite original; isso **não significa** que as árvores estejam fora, pois os cantos do envelope podem não ter árvores. A contagem municipal usa então uma generalização **feita pelo serviço oficial** (0.0001 grau, aproximadamente 11m; precisão 6 casas), preservada separadamente. Essa contagem global é aproximada e não resolve pontos eventualmente situados na faixa de tolerância da fronteira. A amostra usa o polígono original, sem generalização. A execução inicial interrompida foi registrada em evidencias/execucao_poligono_erro500.json. Um teste exploratório anterior de generalização sem precisão explícita retornou polígono degenerado, rejeitado; o script exige precisão explícita e mais de 100 vértices.
