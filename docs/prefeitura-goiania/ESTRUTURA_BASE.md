# Estrutura da base pública de arborização

Consulta iniciada: **2026-09-26T22:15:41.045Z**. Fonte: [serviço municipal](https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer), [Árvore](https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer/3), [dicionário oficial](https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/ARV%20CDESPECIE.htm) e [documentação da entidade](https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/Arv.htm). Respostas originais, horários, parâmetros e SHA-256: [consultas.json](../../data/prefeitura/consultas.json). Apenas fontes públicas da Prefeitura; nenhuma escrita em banco.

Camada **Árvore**, esriGeometryPoint, **107 campos**, ObjectID **OBJECTID**, displayField **id**. Referência original **EPSG:31982**; geometrias da amostra solicitadas em **EPSG:4326** (longitude, latitude). maxRecordCount **1000**; paginação **true**; estatísticas **true**; distinct **true**.

**Espécie:** cdespecie (Double) é o código. nm (String, 80) é “Cópia do atributo CDESPECIE” na ajuda oficial; os valores reais são códigos numéricos textuais e o sentinela Number Null. Não existe campo de nome científico na camada. Domínios: 0; relationships: []; tabelas no serviço: []. A relação com nomes vem do HTML público legado, não de join/domínio REST.

Extent declarado em EPSG:31982: {"xmin":678764.1142999995,"ymin":8149239.9296,"xmax":689843.6634999998,"ymax":8159784.0861,"spatialReference":{"wkid":31982,"latestWkid":31982}}. O inventário cobre apenas parte do município; não se pode concluir cobertura integral. x_coord/y_coord são atributos separados da geometria; não convertê-los diretamente em longitude/latitude. dtlevanta é texto de 8 caracteres; os demais campos Date são timestamps ArcGIS, sem inferir data de vistoria ou fuso quando não documentados.

## Todos os campos

| Campo | Alias | Tipo | Tamanho | Domínio/coded values |
|---|---|---|---:|---|
| OBJECTID | objectid | esriFieldTypeOID | — | Nenhum (null) |
| id | id | esriFieldTypeString | 12 | Nenhum (null) |
| nrlote | nrlote | esriFieldTypeString | 10 | Nenhum (null) |
| cdespecie | cdespecie | esriFieldTypeDouble | — | Nenhum (null) |
| inidade | inidade | esriFieldTypeString | 1 | Nenhum (null) |
| inporte | inporte | esriFieldTypeString | 1 | Nenhum (null) |
| incondarv | incondarv | esriFieldTypeString | 1 | Nenhum (null) |
| indiamcopa | indiamcopa | esriFieldTypeString | 50 | Nenhum (null) |
| poda | poda | esriFieldTypeString | 20 | Nenhum (null) |
| inpodalp | inpodalp | esriFieldTypeString | 2 | Nenhum (null) |
| inpodalc | inpodalc | esriFieldTypeString | 2 | Nenhum (null) |
| inpodapu | inpodapu | esriFieldTypeString | 2 | Nenhum (null) |
| inpodapl | inpodapl | esriFieldTypeString | 2 | Nenhum (null) |
| inpodarc | inpodarc | esriFieldTypeString | 2 | Nenhum (null) |
| inpodasp | inpodasp | esriFieldTypeString | 2 | Nenhum (null) |
| inasppai | inasppai | esriFieldTypeString | 2 | Nenhum (null) |
| inalttens | inalttens | esriFieldTypeString | 1 | Nenhum (null) |
| inbaitens | inbaitens | esriFieldTypeString | 1 | Nenhum (null) |
| intelefone | intelefone | esriFieldTypeString | 1 | Nenhum (null) |
| inilumina | inilumina | esriFieldTypeString | 1 | Nenhum (null) |
| inoutras | inoutras | esriFieldTypeString | 10 | Nenhum (null) |
| incap | incap | esriFieldTypeString | 25 | Nenhum (null) |
| incodfus | incodfus | esriFieldTypeString | 2 | Nenhum (null) |
| indistlote | indistlote | esriFieldTypeString | 50 | Nenhum (null) |
| indistedif | indistedif | esriFieldTypeString | 50 | Nenhum (null) |
| indistmfio | indistmfio | esriFieldTypeString | 50 | Nenhum (null) |
| incondraiz | incondraiz | esriFieldTypeString | 2 | Nenhum (null) |
| ininterfte | ininterfte | esriFieldTypeString | 1 | Nenhum (null) |
| ininterfsa | ininterfsa | esriFieldTypeString | 1 | Nenhum (null) |
| ininterfca | ininterfca | esriFieldTypeString | 1 | Nenhum (null) |
| ininterfas | ininterfas | esriFieldTypeString | 1 | Nenhum (null) |
| ininterfmf | ininterfmf | esriFieldTypeString | 1 | Nenhum (null) |
| ininterfbh | ininterfbh | esriFieldTypeString | 10 | Nenhum (null) |
| inalinha | inalinha | esriFieldTypeString | 1 | Nenhum (null) |
| necessidad | necessidad | esriFieldTypeString | 30 | Nenhum (null) |
| inrt | inrt | esriFieldTypeString | 2 | Nenhum (null) |
| inpt | inpt | esriFieldTypeString | 2 | Nenhum (null) |
| inpm | inpm | esriFieldTypeString | 2 | Nenhum (null) |
| inpl | inpl | esriFieldTypeString | 2 | Nenhum (null) |
| inrd | inrd | esriFieldTypeString | 2 | Nenhum (null) |
| incp | incp | esriFieldTypeString | 2 | Nenhum (null) |
| incd | incd | esriFieldTypeString | 2 | Nenhum (null) |
| inaf | inaf | esriFieldTypeString | 2 | Nenhum (null) |
| inst | inst | esriFieldTypeString | 2 | Nenhum (null) |
| inri | inri | esriFieldTypeString | 2 | Nenhum (null) |
| inrf | inrf | esriFieldTypeString | 2 | Nenhum (null) |
| inpf | inpf | esriFieldTypeString | 2 | Nenhum (null) |
| intu | intu | esriFieldTypeString | 2 | Nenhum (null) |
| inobs | inobs | esriFieldTypeString | 25 | Nenhum (null) |
| dtlevanta | dtlevanta | esriFieldTypeString | 8 | Nenhum (null) |
| id_lot | id_lot | esriFieldTypeString | 12 | Nenhum (null) |
| id_qdr | id_qdr | esriFieldTypeString | 12 | Nenhum (null) |
| id_mfi | id_mfi | esriFieldTypeString | 17 | Nenhum (null) |
| id_seg | id_seg | esriFieldTypeString | 17 | Nenhum (null) |
| distance | distance | esriFieldTypeDouble | — | Nenhum (null) |
| idlocal | idlocal | esriFieldTypeString | 1 | Nenhum (null) |
| cdtparvore | cdtparvore | esriFieldTypeInteger | — | Nenhum (null) |
| porte | porte | esriFieldTypeString | 1 | Nenhum (null) |
| idade | idade | esriFieldTypeString | 1 | Nenhum (null) |
| cap | cap | esriFieldTypeInteger | — | Nenhum (null) |
| fuste_cond | fuste_cond | esriFieldTypeString | 3 | Nenhum (null) |
| dist_ccivi | dist_ccivi | esriFieldTypeDouble | — | Nenhum (null) |
| dpc | dpc | esriFieldTypeDouble | — | Nenhum (null) |
| copa_condi | copa_condi | esriFieldTypeString | 1 | Nenhum (null) |
| tipo_poda | tipo_poda | esriFieldTypeString | 2 | Nenhum (null) |
| asp_paisag | asp_paisag | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_rat | eqp_rat | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_rbt | eqp_rbt | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_fiasec | eqp_fiasec | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_telefo | eqp_telefo | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_transi | eqp_transi | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_ilumin | eqp_ilumin | esriFieldTypeString | 1 | Nenhum (null) |
| raiz_condi | raiz_condi | esriFieldTypeString | 3 | Nenhum (null) |
| eqp_agua | eqp_agua | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_esgoto | eqp_esgoto | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_calcad | eqp_calcad | esriFieldTypeString | 1 | Nenhum (null) |
| eqp_meiofi | eqp_meiofi | esriFieldTypeString | 1 | Nenhum (null) |
| cdoutr_int | cdoutr_int | esriFieldTypeString | 3 | Nenhum (null) |
| observacao | observacao | esriFieldTypeString | 30 | Nenhum (null) |
| instatus | instatus | esriFieldTypeString | 1 | Nenhum (null) |
| dtplantio | dtplantio | esriFieldTypeDate | 8 | Nenhum (null) |
| dtcadastro | dtcadastro | esriFieldTypeDate | 8 | Nenhum (null) |
| dtatualiza | dtatualiza | esriFieldTypeDate | 8 | Nenhum (null) |
| plano_oper | plano_oper | esriFieldTypeInteger | — | Nenhum (null) |
| nrquadra | nrquadra | esriFieldTypeString | 5 | Nenhum (null) |
| larg_rua | larg_rua | esriFieldTypeDouble | — | Nenhum (null) |
| larg_calca | larg_calca | esriFieldTypeDouble | — | Nenhum (null) |
| cdbairro | cdbairro | esriFieldTypeInteger | — | Nenhum (null) |
| cdlogradou | cdlogradou | esriFieldTypeInteger | — | Nenhum (null) |
| cdind1 | cdind1 | esriFieldTypeString | 2 | Nenhum (null) |
| dsind1 | dsind1 | esriFieldTypeString | 30 | Nenhum (null) |
| cdind2 | cdind2 | esriFieldTypeString | 2 | Nenhum (null) |
| dsind2 | dsind2 | esriFieldTypeString | 30 | Nenhum (null) |
| cdind3 | cdind3 | esriFieldTypeString | 2 | Nenhum (null) |
| dsind3 | dsind3 | esriFieldTypeString | 30 | Nenhum (null) |
| cdind4 | cdind4 | esriFieldTypeString | 2 | Nenhum (null) |
| dsind4 | dsind4 | esriFieldTypeString | 30 | Nenhum (null) |
| cdind5 | cdind5 | esriFieldTypeString | 2 | Nenhum (null) |
| dsind5 | dsind5 | esriFieldTypeString | 30 | Nenhum (null) |
| nm | nm | esriFieldTypeString | 80 | Nenhum (null) |
| x_coord | x_coord | esriFieldTypeDouble | — | Nenhum (null) |
| y_coord | y_coord | esriFieldTypeDouble | — | Nenhum (null) |
| shape | shape | esriFieldTypeGeometry | — | Nenhum (null) |
| created_user | created_user | esriFieldTypeString | 255 | Nenhum (null) |
| created_date | created_date | esriFieldTypeDate | 8 | Nenhum (null) |
| last_edited_user | last_edited_user | esriFieldTypeString | 255 | Nenhum (null) |
| last_edited_date | last_edited_date | esriFieldTypeDate | 8 | Nenhum (null) |
