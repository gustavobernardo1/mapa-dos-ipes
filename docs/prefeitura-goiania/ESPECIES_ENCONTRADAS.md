# Espécies e nomenclatura encontradas

Consulta iniciada: **2026-09-26T22:15:41.045Z**. Fonte: [serviço municipal](https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer), [Árvore](https://portalmapa.goiania.go.gov.br/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer/3), [dicionário oficial](https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/ARV%20CDESPECIE.htm) e [documentação da entidade](https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/Arv.htm). Respostas originais, horários, parâmetros e SHA-256: [consultas.json](../../data/prefeitura/consultas.json). Apenas fontes públicas da Prefeitura; nenhuma escrita em banco.

A descoberta ocorreu **antes do filtro**: 385 valores distintos ordenados de nm e 383 de cdespecie. Todos estão em [especies_distintas.json](../../data/prefeitura/especies_distintas.json), com os 385 grupos e suas frequências. O dicionário possui 314 códigos; 303 estão presentes na camada. Acentos foram decodificados conforme charset windows-1252, preservando os bytes originais. O HTML legado não informa versão/data de validade; nenhum nome foi modernizado para Handroanthus por inferência.

Busca ampla, sem distinção de caixa/acentos: IPE, IPÊ, TABEBUIA, HANDROANTHUS, em nome popular e científico do dicionário. Uma ocorrência lexical pode ser enganosa (por exemplo Piper, efetivamente encontrado); não constitui classificação. Na camada nm não há nomes de ipês. “Number Null” ocorre em 273 registros e acompanha código 0. Outras divergências de representação entre nm e o código: [{"nm":"62.00000000","cdespecie":62,"n":1}]; preservadas sem criar nova espécie. CDTPARVORE também foi inspecionado antes da seleção: 60 valores. A ajuda oficial fornece apenas o tipo N(3), sem descrição ou dicionário; não reutilizar a tabela de CDESPECIE nesse campo por coincidência de números.

## Regra e candidatos

Selecionar somente códigos efetivamente observados cuja coluna NMCIENTIFICO do dicionário contém literalmente Tabebuia ou Handroanthus. SQL: `cdespecie IN (16,36,118,119,166,175,176,306)`. Total: **1.914**. Não assumir equivalência taxonômica atual. A cor é derivada somente de palavras explícitas no nome popular; caraíba permanece NAO_INFORMADA.

| Código | Nome municipal | Científico municipal | Quantidade | Cor literal |
|---:|---|---|---:|---|
| 16 | Ipê-roxo | Tabebuia impetiginosa | 708 | ROXO |
| 36 | Ipê-amarelo vellosoi | Tabebuia vellosoi | 174 | AMARELO |
| 118 | Ipê-amarelo-do-cerrado,taipoca | Tabebuia chrysotricha | 150 | AMARELO |
| 119 | Ipê-rosa | Tabebuia rosea | 462 | ROSA |
| 166 | Ipê-Branco | Tabebuia roseo-alba | 45 | BRANCO |
| 175 | Ipê-amarelo | Tabebuia serratifolia | 335 | AMARELO |
| 176 | Ipê-roxo-de-sete-folhas | Tabebuia heptaphylla | 39 | ROXO |
| 306 | Ipê-caraíba | Tabebuia aurea (Manso) | 1 | NAO_INFORMADA |

## Correspondências lexicais excluídas

- 3: **Ipê-de-jardim,cedrinho**, Tecoma stans, 2.499 registros. Não pertence aos gêneros selecionados no dicionário.
- 22: **Iuca**, Yucca elephantipes, 50 registros. Não pertence aos gêneros selecionados no dicionário.
- 113: **Caliandra-rosa,esponjinha-rosa,escumilha**, Calliandra brevipes, 162 registros. Não pertence aos gêneros selecionados no dicionário.
- 287: **Falso-jaborandi**, Piper, 2 registros. Não pertence aos gêneros selecionados no dicionário.

Grafias distintas são preservadas (hífens, maiúsculas e nomes compostos). Não foram fundidos códigos de espécies diferentes. Códigos com o mesmo nome científico literal: []; essa comparação não resolve sinonímia taxonômica. Código 0/nulo: 8.709 (9.658%). Códigos não zero sem descrição: 331 (0.367%); lista completa no JSON. Não inferir nomes desses códigos.

## Dicionário completo, inclusive espécies sem ocorrências

| Código | Nome popular original | Científico original | Registros na camada | Destaque lexical |
|---:|---|---|---:|---|
| 0 | Não informada | Não Informada | 8.709 |  |
| 1 | Monguba | Pachira aquatica | 13.981 |  |
| 2 | Palmeira-Areca | Dypsis lutescens | 1.085 |  |
| 3 | Ipê-de-jardim,cedrinho | Tecoma stans | 2.499 | Sim |
| 4 | Alfeneiro, ligustro | Ligustrum japonicum | 119 |  |
| 5 | Ficus-benjamim | Ficus benjamina | 5.750 |  |
| 6 | Cássia-sena-café | Senna siamea | 264 |  |
| 7 | Flor-de-abril | Dillenia indica | 154 |  |
| 8 | Sibipiruna | Caesalpinia peltophoroides | 14.656 |  |
| 9 | Mangueira | Mangifera indica | 1.406 |  |
| 10 | Flamboyant | Delonix regia | 1.125 |  |
| 11 | Guariroba | Syagrus oleracea | 4.930 |  |
| 12 | Palmeira-seafórtea | Arcontophoenix cunninghamii | 229 |  |
| 13 | Tuia-maçã | Thuja | 38 |  |
| 14 | Cica | Cyccas circinalis | 20 |  |
| 15 | Palmeira-bacuri | Attalea phalerata | 260 |  |
| 16 | Ipê-roxo | Tabebuia impetiginosa | 708 | Sim |
| 17 | Angico | Anadenanthera peregrina | 91 |  |
| 18 | Embaúba | Cecropia pachystachya | 20 |  |
| 19 | Pau-brasil | Caesalpinia echinata | 133 |  |
| 20 | Tuia-piramidal | Thuja piramidalis | 70 |  |
| 21 | Dracena-gigante | Dracaena arborea | 24 |  |
| 22 | Iuca | Yucca elephantipes | 50 | Sim |
| 23 | Hibisco-vermelho | Hibiscus rosa-sinensis | 129 |  |
| 24 | Espirradeira | Nerium oleander | 466 |  |
| 25 | Palmeira-leque-do-ceará | Pritchardia pacifica | 54 |  |
| 26 | Cajueiro | Anacardium occidentale | 112 |  |
| 27 | Quaresmeira-roxa | Tibouchina granulosa | 2.633 |  |
| 28 | Palmeira-imperial | Roystonea borinqueana | 2.492 |  |
| 29 | Cedro | Cedrela fissilis | 40 |  |
| 30 | Espatódea | Spathodea campanulata | 821 |  |
| 31 | Palmeira-macaúba | Acrocomia aculeata | 98 |  |
| 32 | Murta | Murraya exotica | 365 |  |
| 33 | Chapéu-de-napoleão | Thevetia peruviana | 118 |  |
| 34 | Tamarindeiro | Tamarindus indica | 162 |  |
| 35 | Gameleira,ficus-gigante | Ficus elastica | 55 |  |
| 36 | Ipê-amarelo vellosoi | Tabebuia vellosoi | 174 | Sim |
| 37 | Palmeira-rabo-de-peixe | Caryota urens | 470 |  |
| 38 | Palmeira-rabo-de-peixe-pequena | Caryota mitis | 74 |  |
| 39 | Jasmin-manga | Plumeria rubra | 81 |  |
| 40 | Palmeira-latânia | Livistona chinensis | 10 |  |
| 41 | Árvore-dos-viajantes | Ravenala madagascariensis | 2 |  |
| 42 | Palmeira-pitcosperma | Ptychosperma elegans | 3 |  |
| 43 | Palmeira-silvestre | Syagrus flexuosa | 12 |  |
| 44 | Sete-copas | Terminalia catappa | 4.393 |  |
| 45 | Magnólia | Magnolia grandiflora | 67 |  |
| 46 | Ficus-variegata | Ficus variegata | 239 |  |
| 47 | Cheflera-gigante | Schefflera actinophylla | 19 |  |
| 48 | Cássia-silvestre | Cassia | 7 |  |
| 49 | Seringueira | Hevea brasiliensis | 3 |  |
| 50 | Extremosa, resedá | Lagerstroemia indica | 420 |  |
| 51 | Ficus-microcarpa | Ficus microcarpa | 113 |  |
| 52 | Jaboticabeira | Myrciaria cauliflora | 7 |  |
| 53 | Croton | Cordia variegatum | 8 |  |
| 54 | Aalecrim-de-campinas | Holocalyx balansae | 49 |  |
| 55 | Saboneteiro | Sapindus saponaria | 603 |  |
| 56 | Ficus-lirata | Ficus lyrata | 135 |  |
| 57 | Palmeira-fenix,tamareira-anã,tamareira-de-jardim | Phoenix roebelinii | 233 |  |
| 58 | Jambo-do-pará,jambo-vermelho | Eugenia malaccensis | 987 |  |
| 59 | Jambolão,jamelão | Eugenia jambolana | 894 |  |
| 60 | Flamboyant-mirim | Caesalpinia pulcherrima | 322 |  |
| 61 | Mulungu-de-jardim | Erythrina crista-galli | 3 |  |
| 62 | Bauhinia-lilás,pata-de-vaca | Bauhinia variegata | 1.581 |  |
| 63 | Bauhinia-rosa | Bauhinia blakeana | 995 |  |
| 64 | Palmeira-jerivá | Syagrus romanzoffiana | 28 |  |
| 65 | Canela-de-ema | Dracaena marginata | Não observado |  |
| 66 | Cássia-são-joão | Senna macranthera | 245 |  |
| 67 | Abacateiro | Persea gratissima | 201 |  |
| 68 | Jaca | Artocarpus frondosus | 106 |  |
| 69 | Ingá-banana | Inga uraguensis | 52 |  |
| 70 | Ficus-branco | Ficus rubiginosa | 9 |  |
| 71 | Cajá-manga | Spondias dulcis | 37 |  |
| 72 | Limão | Citrus lemon | 104 |  |
| 73 | Hibisco-colibri,malva | Malvaviscus arboreus | 9 |  |
| 74 | Dracena-rajada | Dracaena fragans | 11 |  |
| 75 | Albisia | Albizia lebbeck | 806 |  |
| 76 | Goiabeira | Psidium guajava | 514 |  |
| 77 | Mamoeiro | Carica papaya | 17 |  |
| 78 | Leucena | Leucaena leucocephala | 297 |  |
| 79 | Ingá | Inga cylindrica | 70 |  |
| 80 | Álamo | Populus tremuloides | 555 |  |
| 81 | Grevilea-robusta | Grevillea robusta | 24 |  |
| 82 | Oiti | Licania tomentosa | 1.259 |  |
| 83 | Manacá-de-cheiro,manacá-de-jardim | Brunfelsia unifora | 18 |  |
| 84 | Palmeira-leque-cubana | Coccothrinax fragans | 95 |  |
| 85 | Grevilea-vermelha | Grevillea banksii | 51 |  |
| 86 | Canafístula | Peltophorum dubium | 13 |  |
| 87 | Amoreira | Morus nigra | 138 |  |
| 88 | Mutamba | Guazuma ulmifolia | 51 |  |
| 89 | Duranta | Duranta repens | 92 |  |
| 90 | Camará | Lantana camara | Não observado |  |
| 91 | Mussaenda | Mussaenda erythrophylla | 31 |  |
| 92 | Boldo | Vernonia condensata | 32 |  |
| 93 | Lea-rubra | Leea rubra | 3 |  |
| 94 | Cheflera | Schefflera arboricola | 17 |  |
| 95 | Cactus | Opuntia | 2 |  |
| 96 | Rosa | Rosa | Não observado |  |
| 97 | Cássia-de-java,cássia-javânica | Cassia javanica | 356 |  |
| 98 | Gameleira | Ficus insipida | 32 |  |
| 99 | Gameleira-folha-miúda | Ficus | 33 |  |
| 100 | Algaroba | Prosopis algarobilla | 35 |  |
| 101 | Aroeira-Falsa,aroeira-pimenteira | Schinus terebinthifolius | 15 |  |
| 102 | Aroeira-salsa | Schinus molle | 398 |  |
| 103 | Bálsamo | Myroxylon peruiferum | 253 |  |
| 104 | Bauhinia-branca,pata-de-vaca | Bauhinia variegata | 503 |  |
| 105 | Amendoim-bravo,pau-de-fava,madeira-nova | Pterogyne nitens | 11 |  |
| 106 | Cássia-rosa,cássia-grande | Cassia grandis | 165 |  |
| 107 | Cerejeira-do-mato | Eugenia involucrata | 24 |  |
| 108 | Ciriguela | Spondias purpurea | 43 |  |
| 109 | Chuva-de-ouro | Cassia fistula | 514 |  |
| 110 | Cinamomo,santa-bárbara | Melia azedarach | 239 |  |
| 111 | Clusia | Clusia | 31 |  |
| 112 | Calistemon (galhos eretos) | Callistemon citrinus | 78 |  |
| 113 | Caliandra-rosa,esponjinha-rosa,escumilha | Calliandra brevipes | 162 | Sim |
| 114 | Genipapo | Genipa americana | 35 |  |
| 115 | Guapeva,curiola,cabo-de-machado | Pouteria torta | 13 |  |
| 116 | Hibisco-da-China | Hibiscus syriacus | 12 |  |
| 117 | Ingá-de-quatro-quinas | Inga affinis | 13 |  |
| 118 | Ipê-amarelo-do-cerrado,taipoca | Tabebuia chrysotricha | 150 | Sim |
| 119 | Ipê-rosa | Tabebuia rosea | 462 | Sim |
| 120 | Jatobá-da-mata | Hymenaea courbaril | 17 |  |
| 121 | Magnólia-amarela | Michelia champaca | 111 |  |
| 122 | Manacá-da-serra | Tibouchina mutabilis | 9 |  |
| 123 | Mogno | Swietenia macrophylla | 84 |  |
| 124 | Mulungu-do-litoral | Erythrina speciosa | 8 |  |
| 125 | Paineira,barriguda | Chorisia speciosa | 835 |  |
| 126 | Pau-ferro | Caesalpinia ferrea | 211 |  |
| 127 | Perobinha-do-campo | Sweetia elegans | 5 |  |
| 128 | Pitangueira | Eugenia uniflora | 64 |  |
| 129 | Romã | Punica granatum | 26 |  |
| 130 | Sombreiro | Clitoria fairchildiana | 8 |  |
| 131 | Tarumã | Vitex megapotamica | 2 |  |
| 132 | Tipuana | Tipuana tipu | 2 |  |
| 133 | Urucum | Bixa orellana | 208 |  |
| 134 | Lobeira | Solanum lycocarpum | 2 |  |
| 135 | Bougainvilea-rosa,Primavera | Bougainvillaea glabra | 428 |  |
| 136 | Bougainvilea-dobrada | Boungaivillaea spectabillis | 40 |  |
| 137 | Lea-verde | Leea coccinea | 23 |  |
| 138 | Ipomea | Ipomoea fistulosa | Não observado |  |
| 139 | Dama-da-noite | Cestrum aff. nocturnum | 9 |  |
| 140 | Palmeira-bacaba | Oenocarpus bacaba | 5 |  |
| 141 | Polyscia,árvore-da-felicidade-fêmea | Polyscias fruticosa | 27 |  |
| 142 | Caliandra-branca | Calliandra inaequilatera | 7 |  |
| 143 | Garapa | Apuleia mollaris | 1 |  |
| 144 | Pau-dóleo | Copaifera langsdorffii | 8 |  |
| 145 | Pinheiro-do-paraná | Araucaria angustifolia | 126 |  |
| 146 | Marinheiro | Guarea aff. guidonia | 4 |  |
| 147 | Carne-de-vaca | Roupala aff. brasiliensis | Não observado |  |
| 148 | Mirindiba | Terminalia glabrescens | 11 |  |
| 149 | Freijó,Córdia-preta | Cordia goeldiana | 1 |  |
| 150 | Astrapéia | Dombeya wallichii | 9 |  |
| 151 | Sabal-de-cuba | Sabal aff. maritima | 5 |  |
| 152 | Jacarandá-mimoso | Jacaranda cuspidifolia | 83 |  |
| 153 | Castanha-do-Maranhão | Bombacopsis glabra | 53 |  |
| 154 | Ora-pró-nobis | Pereskia grandiflora | 1 |  |
| 155 | Cássia-negra | Cassia aff. nigricans | 6 |  |
| 156 | Quaresmeira-arbustiva | Tibouchina grandiflora | 26 |  |
| 157 | Fruta-pão | Artocarpus incisa | 4 |  |
| 158 | Polyscia,Árvore-da-felicidade-macho | Polyscias guilfoylei | 34 |  |
| 159 | Pau-formiga | Triplaris brasiliana | 42 |  |
| 160 | Pinus,Pinheiro | Pinus elliottii | 157 |  |
| 161 | Hibisco | Hibiscus tilacoides | Não observado |  |
| 162 | Eucalipto | Eucalyptus | 49 |  |
| 163 | Ameixa | Eriobotrya japonica | 44 |  |
| 164 | Coco-da-Bahia,Coqueiro,Coqueiro-da-Bahia | Cocos nucifera | 69 |  |
| 165 | Aroeira-do-Cerrado | Myracrodruon urundeuva | 9 |  |
| 166 | Ipê-Branco | Tabebuia roseo-alba | 45 | Sim |
| 167 | Jacarandá-bico-de-pato | Machaerium aculeatum | 18 |  |
| 168 | Limão-japonês | Averrhoa bilimbi | 4 |  |
| 169 | Acerola | Malpighia glabra | 34 |  |
| 170 | Joazeiro | Zizyphus joazeiro | 3 |  |
| 171 | Bico-de-papagaio | Euphorbia pulcherrima | 16 |  |
| 172 | Louro-branco | Cordia glabrata | 1 |  |
| 173 | Ata,Pinha,Fruta-de-Conde | Annona squamosa | 95 |  |
| 174 | Ligustrum | Ligustrum ovalifolium | 16 |  |
| 175 | Ipê-amarelo | Tabebuia serratifolia | 335 | Sim |
| 176 | Ipê-roxo-de-sete-folhas | Tabebuia heptaphylla | 39 | Sim |
| 177 | Bambu | Bambusa vulgaris | 12 |  |
| 178 | Guapuruvu | Schizolobium parahyba | 22 |  |
| 179 | Tamboril,Orelha-de-negro | Enterolobium contortisiliquum | 21 |  |
| 180 | Orgulho-da-Índia | Lagerstroemia flos-reginae | 14 |  |
| 181 | Canela | Nectandra | 74 |  |
| 182 | Cagaita | Eugenia dysenterica | 1 |  |
| 183 | Emburana | Bursera leptophlocos | 1 |  |
| 184 | Baru | Dipteryx alata | 5 |  |
| 185 | Pitombeira, Olho-de-Boi | Talisia esculenta | 25 |  |
| 186 | Jambo-amarelo | Eugenia jambos | 69 |  |
| 187 | Lima-doce | Citrus aurantifolia | 2 |  |
| 188 | Palmeira-rubra | Dictyosperma aureum | 3 |  |
| 189 | Clusia-rosa | Clusia rosea | 21 |  |
| 190 | Graviola | Annona muricata | 23 |  |
| 191 | Lanterneiro | Lophantera lactescens | 55 |  |
| 192 | Mamica-de-porca | Zanthoxyllum riedelianum | 3 |  |
| 193 | Pau-terra-da-folha-larga | Qualea grandiflora | 2 |  |
| 194 | Algodoeiro | Heliocarpus americanus | 13 |  |
| 195 | Jatobá-do-cerrado | Hymenaea stigonocarpa | 16 |  |
| 196 | Pequi | Caryocar brasiliense | 4 |  |
| 197 | Cedrela | Cedrela | 6 |  |
| 198 | Cupuaçu | Theobroma grandiflorum | 2 |  |
| 199 | Ouratia | Ouratea | 12 |  |
| 200 | Pau-ferro, Juçá | Caesalpinia ferrea | 162 |  |
| 201 | Cacau | Theobroma cacao | 10 |  |
| 202 | Araçá | Psidium cattleianum | 4 |  |
| 203 | Tapirira | Tapirira | 1 |  |
| 204 | Pau-cigarra,Aleluia | Senna multijuga | 2 |  |
| 205 | Jacarandá-do-campo | Machaerium acutifolium | 34 |  |
| 206 | Bignoniaceae | Bignoniaceae | 2 |  |
| 207 | Babaçu | Attalea speciosa | 12 |  |
| 208 | Congea | Congea tomentosa | 2 |  |
| 209 | Algodão-de-praia,Tespésia(Flor amarela) | Thespesia populnea | 8 |  |
| 210 | Algodão-de-praia (Flor lilás ou rosa) | Hibiscus | 12 |  |
| 211 | Babosa-branca, Manacá-branco | Cordia superba | 3 |  |
| 212 | Escumilha-africana | Lagerstroemia speciosa | 18 |  |
| 213 | Bananeira | Musa paradisiaca | 17 |  |
| 214 | Chorão | Salyx babylonica | 18 |  |
| 215 | Neve-da-montanha,cabeleira-de-velho | Euphorbia leucocephala | 195 |  |
| 216 | Cipreste | Cupressus | 51 |  |
| 217 | Levitação, Catau | Catalpa kaempferi | Não observado |  |
| 218 | Melaleuca | Melaleuca lencadendron | 14 |  |
| 219 | Calistemon (Galhos pendentes) | Callistemon viminalis | 69 |  |
| 220 | Eucalipto-ornamental | Eucalyptus cinerea | 48 |  |
| 221 | Laranjeira | Citrus aurantium | 38 |  |
| 222 | Alecrim-de-campinas | Holocalyx glaziouvii | 3 |  |
| 223 | Ficus-benjamina-variegata | Ficus benjamina | 152 |  |
| 224 | Chichá | Sterculia chicha | 10 |  |
| 225 | Caliandra-vermelha, Esponjinha-vermelha | Calliandra tweedii | 177 |  |
| 226 | Cássia-ferrugínea | Cassia ferrruginea | 4 |  |
| 227 | Mexerica | Citrus deliciosa | 5 |  |
| 228 | Não identificada - Setor Sul | - | 2 |  |
| 229 | Farinha-seca | Albizia niopoides | 18 |  |
| 230 | Feijão-guandu | Cajanus indicus | 29 |  |
| 231 | Assa-peixe | Vernonia | 5 |  |
| 232 | Imbiruçu | Pseudobombax longiflorum | 11 |  |
| 233 | Pau-tento, Tento | Adenanthera pavonina | 45 |  |
| 234 | Pinhão, Pinhão-roxo-do-cerrado | Cnidosculus pubescens | 8 |  |
| 235 | Faveira-do-cerrado | Dimorphandra mollis | 1 |  |
| 236 | Feijão-cru | Platymiscium pubescens | 9 |  |
| 237 | Maria-preta | Terminalia glabrescens | 1 |  |
| 238 | Carvoeiro | Sclerolobium paniculatum | 8 |  |
| 239 | Teca | Tectona grandis | 1 |  |
| 240 | Casuarina | Casuarina cunninghamiana | 15 |  |
| 241 | Jequitibá | Cariniana estrellensis | 3 |  |
| 242 | Erithrina-variegata | Erythrina | 30 |  |
| 243 | Araticum,Articum | Annona coriacea | 1 |  |
| 244 | Vinhático | Plathymenia reticulata | 1 |  |
| 245 | Figueira-branca | Ficus guaranitica | 7 |  |
| 246 | Mirindiba-rosa | Lafoensia glyptocarpa | 1 |  |
| 247 | Pau-terra-da-folha-miúda | Qualea parviflora | 1 |  |
| 248 | Pau-jacaré, Jacaré | Piptadenia gonoacantha | Não observado |  |
| 249 | Jacarandá-canzil, Canzileiro | Platypodium elegans | 19 |  |
| 250 | Paineira-ceiba,Paineira-vermelha-da-Índia | Bombax malabaricum | 5 |  |
| 251 | Mama-cadela, Inharé | Brosimum gaudichaudii | 5 |  |
| 252 | Cutieira, Fruta-de-cotia, Purga-de-cavalo | Joannesia | 3 |  |
| 253 | Pau-branco-falso | Dipteronia sinensis | 6 |  |
| 254 | Ingá sp. | Inga | 75 |  |
| 255 | Pau-perdiz, Pé-de-perdiz, Perdiz | Simarouba versicolor | 1 |  |
| 256 | Guatambu | Aspidosperma subincanum | 22 |  |
| 257 | Sucupira-branca | Pterodon emarginatus | 6 |  |
| 258 | Neen-indiano | Melia indica | 43 |  |
| 259 | Espécie chinesa |  | 4 |  |
| 260 | Gonçalo-alves | Astronium fraxinifolium | 10 |  |
| 261 | Landim | Calophyllum brasiliense | Não observado |  |
| 262 | Eritrina | Erythrina coralloides | 17 |  |
| 263 | Café | Coffea arabica | 1 |  |
| 264 | Ficus-máxima | Ficus maxima | 2 |  |
| 265 | Capitão-do-campo | Terminalia argentea | 4 |  |
| 266 | Cajá-mirim, Cajá-da-mata | Spondias lutea | 4 |  |
| 267 | Guatambu-do-cerrado | Aspidosperma macrocarpon | 9 |  |
| 268 | Amburana,Cerejeira | Amburana cearensis | 9 |  |
| 269 | Amargoso | Vatairea macrocarpa | 2 |  |
| 270 | Angico-de-bezerro | Piptadenia moniliformes | 9 |  |
| 271 | Guatambu-branco | Aspidosperma parvifolium | Não observado |  |
| 272 | Imbú,Umbú | Spondias tuberosa | 8 |  |
| 273 | Ligustro-chinês | Ligustrum sinense | 11 |  |
| 274 | Embireira, Embira-de-sapo | Duguetia hatschbachii | 2 |  |
| 275 | Coité | Crescentia cujete | 4 |  |
| 276 | Ingá-dulce | Pithecellobium dulce | 5 |  |
| 277 | Quaresmeira-orelha-de-onça, orelha-de-burro | Tibouchina grandifolia | 25 |  |
| 278 | Mil-cores | Breynia nivosa | 2 |  |
| 279 | Falsa-cássia | Robinia | 1 |  |
| 280 | Tingui, Tingui-do-cerrado | Magonia pubescens | 3 |  |
| 281 | Castanha-da-Índia | Brachychiton | 3 |  |
| 282 | Sangra-d´água | Croton urucurana | 2 |  |
| 283 | Mata-pasto | Senna alata | 3 |  |
| 284 | Jasmim-da-noite | Cestrum nocturnum | 3 |  |
| 285 | Periquiteira, Crindiúva | Trema micrantha | 2 |  |
| 286 | Pó-de-mico | Não-identificada | 1 |  |
| 287 | Falso-jaborandi | Piper | 2 | Sim |
| 288 | Espinhosa | Caesalpinia spinosa | 2 |  |
| 289 | Planta fruto enrolado (a ser identificada) |  | 3 |  |
| 290 | Erithrina-mulungu, Mulungu | Erythrina mulungu | 1 |  |
| 291 | Laranjinha-do-campo | Styrax ferrugineus | 2 |  |
| 292 | Murici | Byrsonima | 1 |  |
| 293 | Abricó-de-macaco | Couroupita guianensis | 6 |  |
| 294 | Dombéia-rosa | Dombeya burgessiae | 5 |  |
| 295 | Uva-do-pará | Hovenia dulcis | 1 |  |
| 296 | Ficus(não identificado -Setor Bueno) | Coccoloba uvifera | 2 |  |
| 297 | Canelinha | Nectandra megapotamica | 7 |  |
| 298 | Palmeira-triângulo | Dypsis decary | 14 |  |
| 299 | Pau-sobre-pau | Euphorbia tirucalli | 2 |  |
| 300 | Alfarroba | Samanea tubulosa | 1 |  |
| 301 | Pau-de-Jangada | Apeiba tibourbou | 1 |  |
| 302 | Jacarandá-do-campo | Machaerium opacum | 5 |  |
| 303 | Caviúna-do-cerrado | Dalbergia miscolobium | Não observado |  |
| 304 | Capim-Palmeira | Curculigo capitulata | 3 |  |
| 305 | Peroba-rosa | Aspidosperma polyneuron | 1 |  |
| 306 | Ipê-caraíba | Tabebuia aurea (Manso) | 1 | Sim |
| 307 | Pingo-de-ouro | Duranta repens | 3 |  |
| 308 | Espécie não identificada - Setor Bueno |  | 1 |  |
| 309 | Pinus sp. | Pinus | 38 |  |
| 310 | Nóz-macadâmia, Macadâmia | Macadamia tetraphylla | 3 |  |
| 311 | Mandioca | Manihot esculenta | 6 |  |
| 312 | Carambola | Averrhoa carambola | 11 |  |
| 313 | Angico-de-Minas | Enterolobium gummiferum | 1 |  |

## Valores distintos originais

**nm**, em ordem do servidor: `0`, `1`, `10`, `100`, `101`, `102`, `103`, `104`, `105`, `106`, `107`, `108`, `109`, `11`, `110`, `111`, `112`, `113`, `114`, `115`, `116`, `117`, `118`, `119`, `12`, `120`, `121`, `122`, `123`, `124`, `125`, `126`, `127`, `128`, `129`, `13`, `130`, `131`, `132`, `133`, `134`, `135`, `136`, `137`, `139`, `14`, `140`, `141`, `142`, `143`, `144`, `145`, `146`, `148`, `149`, `15`, `150`, `151`, `152`, `153`, `154`, `155`, `156`, `157`, `158`, `159`, `16`, `160`, `162`, `163`, `164`, `165`, `166`, `167`, `168`, `169`, `17`, `170`, `171`, `172`, `173`, `174`, `175`, `176`, `177`, `178`, `179`, `18`, `180`, `181`, `182`, `183`, `184`, `185`, `186`, `187`, `188`, `189`, `19`, `190`, `191`, `192`, `193`, `194`, `195`, `196`, `197`, `198`, `199`, `2`, `20`, `200`, `201`, `202`, `203`, `204`, `205`, `206`, `207`, `208`, `209`, `21`, `210`, `211`, `212`, `213`, `214`, `215`, `216`, `218`, `219`, `22`, `220`, `221`, `222`, `223`, `224`, `225`, `226`, `227`, `228`, `229`, `23`, `230`, `231`, `232`, `233`, `234`, `235`, `236`, `237`, `238`, `239`, `24`, `240`, `241`, `242`, `243`, `244`, `245`, `246`, `247`, `249`, `25`, `250`, `251`, `252`, `253`, `254`, `255`, `256`, `257`, `258`, `259`, `26`, `260`, `262`, `263`, `264`, `265`, `266`, `267`, `268`, `269`, `27`, `270`, `272`, `273`, `274`, `275`, `276`, `277`, `278`, `279`, `28`, `280`, `281`, `282`, `283`, `284`, `285`, `286`, `287`, `288`, `289`, `29`, `290`, `291`, `292`, `293`, `294`, `295`, `296`, `297`, `298`, `299`, `3`, `30`, `300`, `301`, `302`, `304`, `305`, `306`, `307`, `308`, `309`, `31`, `310`, `311`, `312`, `313`, `314`, `316`, `317`, `318`, `319`, `32`, `320`, `321`, `322`, `323`, `324`, `325`, `326`, `327`, `328`, `329`, `33`, `330`, `331`, `332`, `333`, `334`, `335`, `336`, `337`, `338`, `339`, `34`, `340`, `341`, `342`, `343`, `344`, `345`, `346`, `347`, `348`, `349`, `35`, `350`, `351`, `352`, `353`, `354`, `355`, `356`, `357`, `359`, `36`, `360`, `361`, `362`, `363`, `364`, `365`, `367`, `368`, `369`, `37`, `370`, `371`, `373`, `374`, `375`, `376`, `378`, `379`, `38`, `380`, `381`, `382`, `383`, `384`, `385`, `386`, `387`, `388`, `39`, `391`, `392`, `393`, `395`, `397`, `398`, `399`, `4`, `40`, `400`, `401`, `403`, `41`, `42`, `43`, `44`, `45`, `46`, `47`, `48`, `49`, `5`, `50`, `51`, `52`, `53`, `54`, `55`, `56`, `57`, `58`, `59`, `6`, `60`, `61`, `62`, `62.00000000`, `63`, `64`, `66`, `67`, `68`, `69`, `7`, `70`, `71`, `72`, `73`, `74`, `75`, `76`, `77`, `78`, `79`, `8`, `80`, `81`, `82`, `83`, `84`, `85`, `86`, `87`, `88`, `89`, `9`, `91`, `92`, `93`, `94`, `95`, `97`, `98`, `99`, `Number Null`.

**cdespecie**, em ordem numérica: `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`, `11`, `12`, `13`, `14`, `15`, `16`, `17`, `18`, `19`, `20`, `21`, `22`, `23`, `24`, `25`, `26`, `27`, `28`, `29`, `30`, `31`, `32`, `33`, `34`, `35`, `36`, `37`, `38`, `39`, `40`, `41`, `42`, `43`, `44`, `45`, `46`, `47`, `48`, `49`, `50`, `51`, `52`, `53`, `54`, `55`, `56`, `57`, `58`, `59`, `60`, `61`, `62`, `63`, `64`, `66`, `67`, `68`, `69`, `70`, `71`, `72`, `73`, `74`, `75`, `76`, `77`, `78`, `79`, `80`, `81`, `82`, `83`, `84`, `85`, `86`, `87`, `88`, `89`, `91`, `92`, `93`, `94`, `95`, `97`, `98`, `99`, `100`, `101`, `102`, `103`, `104`, `105`, `106`, `107`, `108`, `109`, `110`, `111`, `112`, `113`, `114`, `115`, `116`, `117`, `118`, `119`, `120`, `121`, `122`, `123`, `124`, `125`, `126`, `127`, `128`, `129`, `130`, `131`, `132`, `133`, `134`, `135`, `136`, `137`, `139`, `140`, `141`, `142`, `143`, `144`, `145`, `146`, `148`, `149`, `150`, `151`, `152`, `153`, `154`, `155`, `156`, `157`, `158`, `159`, `160`, `162`, `163`, `164`, `165`, `166`, `167`, `168`, `169`, `170`, `171`, `172`, `173`, `174`, `175`, `176`, `177`, `178`, `179`, `180`, `181`, `182`, `183`, `184`, `185`, `186`, `187`, `188`, `189`, `190`, `191`, `192`, `193`, `194`, `195`, `196`, `197`, `198`, `199`, `200`, `201`, `202`, `203`, `204`, `205`, `206`, `207`, `208`, `209`, `210`, `211`, `212`, `213`, `214`, `215`, `216`, `218`, `219`, `220`, `221`, `222`, `223`, `224`, `225`, `226`, `227`, `228`, `229`, `230`, `231`, `232`, `233`, `234`, `235`, `236`, `237`, `238`, `239`, `240`, `241`, `242`, `243`, `244`, `245`, `246`, `247`, `249`, `250`, `251`, `252`, `253`, `254`, `255`, `256`, `257`, `258`, `259`, `260`, `262`, `263`, `264`, `265`, `266`, `267`, `268`, `269`, `270`, `272`, `273`, `274`, `275`, `276`, `277`, `278`, `279`, `280`, `281`, `282`, `283`, `284`, `285`, `286`, `287`, `288`, `289`, `290`, `291`, `292`, `293`, `294`, `295`, `296`, `297`, `298`, `299`, `300`, `301`, `302`, `304`, `305`, `306`, `307`, `308`, `309`, `310`, `311`, `312`, `313`, `314`, `316`, `317`, `318`, `319`, `320`, `321`, `322`, `323`, `324`, `325`, `326`, `327`, `328`, `329`, `330`, `331`, `332`, `333`, `334`, `335`, `336`, `337`, `338`, `339`, `340`, `341`, `342`, `343`, `344`, `345`, `346`, `347`, `348`, `349`, `350`, `351`, `352`, `353`, `354`, `355`, `356`, `357`, `359`, `360`, `361`, `362`, `363`, `364`, `365`, `367`, `368`, `369`, `370`, `371`, `373`, `374`, `375`, `376`, `378`, `379`, `380`, `381`, `382`, `383`, `384`, `385`, `386`, `387`, `388`, `391`, `392`, `393`, `395`, `397`, `398`, `399`, `400`, `401`, `403`.
