import imageInventory from "./guide-images.json";

export const guideSources = {
  nomesTropicais: {
    title: "Embrapa — Plantas tropicais: nomenclatura",
    url: "https://www.infoteca.cnptia.embrapa.br/infoteca/bitstream/doc/884520/1/livro-plantastropicais-2.pdf",
    type: "Publicação técnica / Embrapa",
    scope:
      "O nome cássia-chuva-de-ouro é associado a Cassia ferruginea e C. fistula; seção de nomes de plantas.",
  },
  municipal: {
    title: "Prefeitura de Goiânia — dicionário histórico de espécies",
    url: "https://portalmapa.goiania.go.gov.br/helpsiggo/HelpSIGGO/ARV%20CDESPECIE.htm",
    type: "Dicionário cadastral oficial",
    scope: "Nomes históricos e códigos; não é uma determinação botânica atual.",
  },
  flora: {
    title: "Flora e Funga do Brasil — lista oficial (JBRJ / GBIF)",
    url: "https://www.gbif.org/dataset/aacd816d-662c-49d2-ad1a-97e66e2a2908",
    type: "Lista taxonômica oficial",
    scope: "Nomes aceitos e família; registros individuais no inventário.",
  },
  cenostigma: {
    title: "Gaem (2020) — Cenostigma, Flora do Brasil",
    url: "https://monografiasfloradobrasil.jbrj.gov.br/cenostigma.pdf",
    type: "Flora / JBRJ",
    scope: "Gênero e variedade peltophoroides, pp. 1 e 16.",
  },
  cassia: {
    title: "Scheidegger & Rando (2020) — Cassia, Flora do Brasil",
    url: "https://monografiasfloradobrasil.jbrj.gov.br/cassia.pdf",
    type: "Flora / JBRJ",
    scope: "Cassia fistula: folhas, racemos e ocorrência cultivada, p. 16.",
  },
  rosa: {
    title: "Carvalho (2003) — Ipê-rosa, Embrapa",
    url: "https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1140085/1/Especies-Arboreas-Brasileiras-vol-1-Ipe-Rosa.pdf",
    type: "Publicação técnica / Embrapa",
    scope: "Tabebuia impetiginosa: descrição, nomes e fenologia, pp. 559–561.",
  },
  roxo: {
    title: "Carvalho (2003) — Ipê-roxo, Embrapa",
    url: "https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1140086/1/Especies-Arboreas-Brasileiras-vol-1-Ipe-Roxo.pdf",
    type: "Publicação técnica / Embrapa",
    scope: "Tabebuia heptaphylla: descrição e fenologia, pp. 567–569.",
  },
  pernambuco: {
    title: "Flora de Pernambuco — aliança Tabebuia (Biota Neotropica)",
    url: "https://www.scielo.br/j/bn/a/s97KmZMzn3tybqrjc78mX6v/",
    type: "Artigo científico / tratamento florístico",
    scope:
      "H. serratifolius, T. roseoalba e T. elliptica; seções 8, 20 e 21. Fenologia de Pernambuco, não de Goiânia.",
  },
  cnc: {
    title: "Fernandez & Rosa (2019) — H. serratifolius, CNCFlora / JBRJ",
    url: "https://proflora.jbrj.gov.br/html/Handroanthus%20serratifolius_2019.html",
    type: "Documento técnico / JBRJ",
    scope: "Nome, hábito decíduo, porte natural e uso ornamental.",
  },
  uenf: {
    title: "Árvores da UENF — Sibipiruna",
    url: "https://uenf.br/projetos/arvoresdauenf/especie-2/sibipiruna/",
    type: "Guia institucional",
    scope: "Nome popular e porte, em nível de espécie.",
  },
  uenfCassia: {
    title: "Árvores da UENF — Chuva-de-ouro",
    url: "https://uenf.br/projetos/arvoresdauenf/especie-2/chuva-de-ouro/",
    type: "Guia institucional",
    scope: "Nome popular associado a Cassia fistula.",
  },
  agroCassia: {
    title: "Orwa et al. (2009) — Cassia fistula, World Agroforestry",
    url: "https://apps.worldagroforestry.org/treedb/AFTPDFS/Cassia_fistula.PDF",
    type: "Base técnica institucional",
    scope: "Morfologia e fenologia na Índia, pp. 1–3.",
  },
  agroTecoma: {
    title: "Orwa et al. (2009) — Tecoma stans, World Agroforestry",
    url: "https://apps.worldagroforestry.org/treedb/AFTPDFS/Tecoma_stans.PDF",
    type: "Base técnica institucional",
    scope:
      "Morfologia, ecologia e uso ornamental, pp. 1–3. Origem regional não adotada por divergência entre fontes.",
  },
} as const;
export type SourceId = keyof typeof guideSources;
export type Fact = { text: string; sources: SourceId[]; pending?: boolean };
export const fact = (text: string, ...sources: SourceId[]): Fact => ({
  text,
  sources,
});
export const pending = (
  text = "Pendente de revisão humana; sem informação local verificada.",
): Fact => ({ text, sources: [], pending: true });
export const factLabels = {
  flower: "Formato da flor",
  arrangement: "Disposição das flores",
  leaves: "Folha",
  foliage: "Folhas durante a floração",
  bark: "Casca",
  size: "Porte",
  canopy: "Copa",
  fruit: "Fruto",
  season: "Época aproximada",
  duration: "Duração da florada",
  habitat: "Habitat e uso urbano",
} as const;
export type FactKey = keyof typeof factLabels;
export type GuideProfile = {
  id: string;
  name: string;
  color: string;
  category: "ipe" | "similar";
  taxon: string;
  synonyms: string[];
  family: string;
  taxonomySources: SourceId[];
  note: Fact;
  clue: Fact;
  confusion: string;
  facts: Record<FactKey, Fact>;
  photoTip: string;
};
export const guide: GuideProfile[] = [
  {
    id: "amarelo",
    name: "Ipê-amarelo",
    color: "yellow",
    category: "ipe",
    taxon: "Handroanthus serratifolius (Vahl) S.Grose",
    synonyms: ["Tabebuia serratifolia"],
    family: "Bignoniaceae",
    taxonomySources: ["flora", "cnc"],
    note: fact(
      "Grupo de várias espécies. Esta ficha descreve H. serratifolius; o cadastro também inclui H. chrysotrichus, H. vellosoi e Tabebuia aurea. As características não valem automaticamente para todos os ipês-amarelos.",
      "flora",
      "municipal",
    ),
    clue: fact(
      "Compare a flor amarela em forma de trombeta com os folíolos que partem de um mesmo ponto.",
      "pernambuco",
    ),
    confusion: "Sibipiruna, chuva-de-ouro e ipê-de-jardim.",
    facts: {
      flower: fact("Amarela, em forma de trombeta.", "pernambuco"),
      arrangement: fact("Agrupamentos ramificados (panículas).", "pernambuco"),
      leaves: fact(
        "Compostas, com 3–5 folíolos; bordas podem variar.",
        "pernambuco",
      ),
      foliage: fact(
        "Decídua; perde folhas. Coincidência com a floração precisa de observação local.",
        "cnc",
      ),
      bark: pending(),
      size: fact(
        "20–37 m em ambiente natural na referência; não é uma faixa urbana.",
        "cnc",
      ),
      canopy: pending(),
      fruit: fact("Cápsula alongada.", "pernambuco"),
      season: fact(
        "Coletas com flores em novembro–janeiro em Pernambuco. Calendário de Goiânia pendente.",
        "pernambuco",
      ),
      duration: pending(
        "Duração típica não verificada; não estimamos dias de florada.",
      ),
      habitat: fact(
        "Ocorre também no Cerrado; usado como ornamental. Isso não confirma árvores atuais de Goiânia.",
        "pernambuco",
        "cnc",
      ),
    },
    photoTip:
      "Inclua a folha inteira, a borda dos folíolos e o conjunto das flores.",
  },
  {
    id: "rosa",
    name: "Ipê-rosa",
    color: "pink",
    category: "ipe",
    taxon: "Handroanthus impetiginosus (Mart. ex DC.) Mattos",
    synonyms: ["Tabebuia impetiginosa", "Tabebuia avellanedae"],
    family: "Bignoniaceae",
    taxonomySources: ["flora", "rosa"],
    note: fact(
      "Rosa e roxo são nomes populares sobrepostos. Exemplo desta ficha: H. impetiginosus, também chamado ipê-roxo. A Prefeitura usa Tabebuia rosea no código 119: é outro táxon, não um sinônimo de H. impetiginosus.",
      "rosa",
      "flora",
      "municipal",
    ),
    clue: fact(
      "Flores rosadas a lilases e folhas geralmente com cinco folíolos. A tonalidade não determina a espécie.",
      "rosa",
    ),
    confusion: "Ipê-roxo; outros ipês chamados rosa, incluindo Tabebuia rosea.",
    facts: {
      flower: fact("Tubular, rosada a lilás.", "rosa"),
      arrangement: fact("Cachos terminais, com aspecto de bolas.", "rosa"),
      leaves: fact(
        "Opostas, digitadas, geralmente com cinco folíolos.",
        "rosa",
      ),
      foliage: fact(
        "Caducifólia. Fotografe a presença de folhas; não use isso sozinho para identificação.",
        "rosa",
      ),
      bark: fact(
        "Acinzentada, com sulcos longitudinais pouco profundos e pequenas fissuras.",
        "rosa",
      ),
      size: fact(
        "10–15 m na Caatinga; pode ser maior em outros ambientes. Faixa urbana local pendente.",
        "rosa",
      ),
      canopy: fact("Larga, aproximadamente semiglobosa.", "rosa"),
      fruit: fact("Alongado, abre na maturidade; sementes aladas.", "rosa"),
      season: fact(
        "A Embrapa registra julho em Goiás. Referência histórica, não previsão anual para Goiânia.",
        "rosa",
      ),
      duration: pending("Duração típica não verificada para Goiânia."),
      habitat: fact(
        "Ocorrência natural registrada em Goiás. A ficha não valida os exemplares municipais.",
        "rosa",
      ),
    },
    photoTip:
      "Mostre a folha completa e a flor de lado; só uma foto da cor não resolve a identificação.",
  },
  {
    id: "roxo",
    name: "Ipê-roxo",
    color: "purple",
    category: "ipe",
    taxon: "Handroanthus heptaphyllus (Vell.) Mattos",
    synonyms: ["Tabebuia heptaphylla"],
    family: "Bignoniaceae",
    taxonomySources: ["flora", "roxo"],
    note: fact(
      "Exemplo desta ficha: H. heptaphyllus, também chamado ipê-rosa. H. impetiginosus também recebe o nome ipê-roxo. A cor não separa com segurança esses grupos populares.",
      "roxo",
      "rosa",
    ),
    clue: fact(
      "Folhas com cinco a sete folíolos; flores podem variar de roxo a rosa.",
      "roxo",
    ),
    confusion: "Ipê-rosa; outros ipês de flores rosadas ou arroxeadas.",
    facts: {
      flower: fact("De roxo a rosa.", "roxo"),
      arrangement: fact("Conjuntos curtos na ponta dos ramos.", "roxo"),
      leaves: fact(
        "Opostas, digitadas, com 5–7 folíolos e bordas serrilhadas.",
        "roxo",
      ),
      foliage: fact(
        "As flores aparecem antes das folhas na descrição da Embrapa.",
        "roxo",
      ),
      bark: fact(
        "Acinzentada a pardo-escura; rugosa, com fissuras longitudinais profundas.",
        "roxo",
      ),
      size: fact(
        "8–20 m na descrição; pode atingir portes maiores. Não é limite urbano.",
        "roxo",
      ),
      canopy: fact("Larga, com folhagem relativamente esparsa.", "roxo"),
      fruit: fact("Cápsula linear, com sementes aladas.", "roxo"),
      season: fact(
        "Julho–setembro em Mato Grosso do Sul na referência. Calendário de Goiânia pendente.",
        "roxo",
      ),
      duration: pending("Duração típica não verificada para Goiânia."),
      habitat: fact(
        "Descrito em florestas estacionais e outras formações. Arborização urbana documentada; ocorrência local exige campo.",
        "roxo",
      ),
    },
    photoTip:
      "Fotografe o número e a borda dos folíolos, a casca e flores próximas.",
  },
  {
    id: "branco",
    name: "Ipê-branco",
    color: "cream",
    category: "ipe",
    taxon: "Tabebuia roseoalba (Ridl.) Sandwith",
    synonyms: ["Bignonia roseo-alba", "Handroanthus roseo-albus"],
    family: "Bignoniaceae",
    taxonomySources: ["flora"],
    note: fact(
      "Nome aceito na lista oficial consultada: Tabebuia roseoalba. Handroanthus roseo-albus aparece como sinônimo na mesma lista. O cadastro escreve Tabebuia roseo-alba; a grafia histórica permanece preservada.",
      "flora",
      "municipal",
    ),
    clue: fact(
      "Flor branca em forma de funil e folhas com três folíolos são pistas para este táxon.",
      "pernambuco",
    ),
    confusion:
      "Tabebuia elliptica, também de flor branca. Veja a comparação específica abaixo.",
    facts: {
      flower: fact("Branca, interior amarelo e tubo rosado.", "pernambuco"),
      arrangement: fact("Panículas.", "pernambuco"),
      leaves: fact("Digitadas, com três folíolos.", "pernambuco"),
      foliage: pending(),
      bark: pending(),
      size: fact(
        "8–10 m no tratamento de Pernambuco; não é faixa universal.",
        "pernambuco",
      ),
      canopy: pending(),
      fruit: fact("Cápsula estreita e achatada.", "pernambuco"),
      season: fact(
        "Coletas com flores em novembro–junho em Pernambuco; sem calendário local validado.",
        "pernambuco",
      ),
      duration: pending(),
      habitat: fact(
        "Descrito também para o Cerrado; isso não valida existência atual em Goiânia.",
        "pernambuco",
      ),
    },
    photoTip:
      "Priorize folha inteira, flor de lado e detalhes da base da flor, sem arrancá-la.",
  },
  {
    id: "sibipiruna",
    name: "Sibipiruna",
    color: "green",
    category: "similar",
    taxon:
      "Cenostigma pluviosum var. peltophoroides (Benth.) Gagnon & G.P.Lewis",
    synonyms: [
      "Caesalpinia peltophoroides",
      "Caesalpinia pluviosa var. peltophoroides",
      "Poincianella pluviosa var. peltophoroides",
    ],
    family: "Fabaceae",
    taxonomySources: ["cenostigma", "flora"],
    note: fact(
      "Tratamos da variedade peltophoroides. A distribuição da espécie Cenostigma pluviosum não deve ser atribuída automaticamente à variedade.",
      "cenostigma",
    ),
    clue: fact(
      "Folha duas vezes dividida, com muitos foliólulos pequenos; flor com pétalas separadas.",
      "cenostigma",
    ),
    confusion: "Ipê-amarelo e outras árvores de flores amarelas.",
    facts: {
      flower: fact(
        "Amarela, com pétalas separadas, sem a trombeta dos ipês.",
        "cenostigma",
      ),
      arrangement: fact(
        "Racemos, conjuntos ao longo de um eixo.",
        "cenostigma",
      ),
      leaves: fact(
        "Bipinadas: divididas em pinas com muitos foliólulos pequenos.",
        "cenostigma",
      ),
      foliage: pending(),
      bark: pending(),
      size: fact("8–16 m no guia da UENF, em nível de espécie.", "uenf"),
      canopy: pending(),
      fruit: fact(
        "Vagens achatadas, lenhosas, que se abrem na maturidade.",
        "cenostigma",
      ),
      season: pending(),
      duration: pending(),
      habitat: fact(
        "Variedade nativa da Mata Atlântica, amplamente cultivada em cidades. Não afirmamos ocorrência silvestre em Goiás.",
        "cenostigma",
      ),
    },
    photoTip:
      "Fotografe uma folha inteira mostrando suas duas divisões e um conjunto de flores.",
  },
  {
    id: "chuva-de-ouro",
    name: "Chuva-de-ouro",
    color: "yellow",
    category: "similar",
    taxon: "Cassia fistula L.",
    synonyms: [],
    family: "Fabaceae",
    taxonomySources: ["flora", "cassia"],
    note: fact(
      "Aqui descrevemos Cassia fistula. A Embrapa também associa cássia-chuva-de-ouro a Cassia ferruginea. São táxons distintos; esta descrição e estas fotos não se aplicam automaticamente a ambos.",
      "uenfCassia",
      "nomesTropicais",
    ),
    clue: fact(
      "Cachos longos e pendentes, pétalas separadas e vagens cilíndricas.",
      "cassia",
      "agroCassia",
    ),
    confusion: "Ipê-amarelo; outras árvores chamadas chuva-de-ouro.",
    facts: {
      flower: fact("Amarela, com cinco pétalas separadas.", "agroCassia"),
      arrangement: fact("Racemos longos e pendentes.", "cassia"),
      leaves: fact(
        "Pinadas, com pares de folíolos ao longo de um eixo.",
        "cassia",
      ),
      foliage: fact(
        "Decídua; pode florescer com pouca folhagem. Ausência de folhas não separa sozinha dos ipês.",
        "agroCassia",
      ),
      bark: fact(
        "Lisa e cinza quando jovem; mais escura e rugosa com a idade.",
        "agroCassia",
      ),
      size: fact(
        "Cerca de 10 m na referência internacional; porte local não validado.",
        "agroCassia",
      ),
      canopy: fact("Ramos espalhados.", "agroCassia"),
      fruit: fact(
        "Vagem longa, cilíndrica, pendente; não se abre espontaneamente.",
        "agroCassia",
      ),
      season: fact(
        "Abril–julho na Índia, com variações. Não é um calendário brasileiro.",
        "agroCassia",
      ),
      duration: pending(),
      habitat: fact(
        "Cultivada no Brasil, com ocorrência cultivada registrada em Goiás pela Flora.",
        "cassia",
      ),
    },
    photoTip:
      "Mostre o cacho inteiro e uma flor; fotografe a vagem se disponível.",
  },
  {
    id: "ipe-de-jardim",
    name: "Ipê-de-jardim",
    color: "green",
    category: "similar",
    taxon: "Tecoma stans (L.) Juss. ex Kunth",
    synonyms: ["Bignonia stans"],
    family: "Bignoniaceae",
    taxonomySources: ["flora"],
    note: fact(
      "Tecoma stans pertence à mesma família dos ipês, mas é outro gênero. O nome popular não faz dela Handroanthus ou Tabebuia.",
      "flora",
    ),
    clue: fact(
      "Flor em trombeta, mas folha pinada: os folíolos ficam ao longo de um eixo, com um na ponta.",
      "agroTecoma",
    ),
    confusion: "Ipê-amarelo, sobretudo quando a foto mostra apenas flores.",
    facts: {
      flower: fact(
        "Trombeta amarela, com cinco lobos arredondados.",
        "agroTecoma",
      ),
      arrangement: fact("Grupos nas pontas dos ramos.", "agroTecoma"),
      leaves: fact(
        "Pinadas, com folíolo terminal maior e margens serrilhadas.",
        "agroTecoma",
      ),
      foliage: pending(),
      bark: fact(
        "Castanha clara a cinza, torna-se rugosa com a idade.",
        "agroTecoma",
      ),
      size: fact(
        "Arbusto ou pequena árvore, 5–7,6 m na referência; não é limite universal.",
        "agroTecoma",
      ),
      canopy: pending(),
      fruit: fact(
        "Cápsulas estreitas, ligeiramente achatadas, com sementes aladas.",
        "agroTecoma",
      ),
      season: pending(),
      duration: pending(),
      habitat: fact(
        "Ornamental que prefere luz e tolera seca. Ocorrência e calendário de Goiânia pendentes.",
        "agroTecoma",
      ),
    },
    photoTip:
      "Mostre a folha inteira presa ao ramo e o hábito da planta, além da flor.",
  },
];
export const guideImages = imageInventory;
export type GuideImage = (typeof guideImages)[number];
export const photoParts = {
  arvore: "Árvore / copa",
  flor: "Flor",
  folha: "Folha",
  casca: "Casca",
  fruto: "Fruto",
} as const;
export const whiteComparison: { label: string; a: Fact; b: Fact }[] = [
  {
    label: "Táxon",
    a: fact("Tabebuia roseoalba", "flora"),
    b: fact("Tabebuia elliptica", "pernambuco"),
  },
  {
    label: "Folha",
    a: fact("Três folíolos.", "pernambuco"),
    b: fact("Cinco folíolos.", "pernambuco"),
  },
  {
    label: "Flor",
    a: fact("Branca; tubo rosado.", "pernambuco"),
    b: fact("Branca; tubo branco.", "pernambuco"),
  },
  {
    label: "Brácteas (na base das flores)",
    a: fact("Triangulares e numerosas.", "pernambuco"),
    b: fact("Finas, em forma de fios.", "pernambuco"),
  },
];
