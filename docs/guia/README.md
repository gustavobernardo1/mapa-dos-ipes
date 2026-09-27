# Guia de identificação

Implementado em /guia: entrada visual com quatro cards de ipês e três semelhantes, sem expansão inline. Cada grupo tem ficha própria; comparação, fotografia e fontes têm páginas dedicadas. O comparador livre conserva os atalhos prioritários e a comparação específica de ipê-branco com Tabebuia elliptica. Fotografias, créditos e referências acompanham o conteúdo. Versão editorial em 2026-09-27, sem chancela de especialista.

Experiência em cinco níveis: reconhecimento visual → pistas rápidas → comparação → informação botânica completa → fontes e metodologia. Rotas, decisões de apresentação e limites das imagens em [arquitetura de informação](ARQUITETURA_INFORMACAO.md).

Objetivo: ajudar a observar características e registrar melhores evidências. Não é chave de identificação validada nem classificação automática. Nomes populares não correspondem necessariamente a uma espécie.

| Grupo         | Táxon de referência                                                  | Situação                       |
| ------------- | -------------------------------------------------------------------- | ------------------------------ |
| Ipê-amarelo   | Handroanthus serratifolius (Vahl) S.Grose                            | Parcial; pendências explícitas |
| Ipê-rosa      | Handroanthus impetiginosus (Mart. ex DC.) Mattos                     | Parcial; pendências explícitas |
| Ipê-roxo      | Handroanthus heptaphyllus (Vell.) Mattos                             | Parcial; pendências explícitas |
| Ipê-branco    | Tabebuia roseoalba (Ridl.) Sandwith                                  | Parcial; pendências explícitas |
| Sibipiruna    | Cenostigma pluviosum var. peltophoroides (Benth.) Gagnon & G.P.Lewis | Parcial; pendências explícitas |
| Chuva-de-ouro | Cassia fistula L.                                                    | Parcial; pendências explícitas |
| Ipê-de-jardim | Tecoma stans (L.) Juss. ex Kunth                                     | Parcial; pendências explícitas |

Conteúdo em [guide.ts](../../src/content/guide.ts); fotos em [guide-images.json](../../src/content/guide-images.json). Interface: [page.tsx](../../src/app/guia/page.tsx), [guide.css](../../src/app/guia/guide.css), [comparador](../../src/components/guide-comparator.tsx), [foto e fallback](../../src/components/guide-photo.tsx), [fatos e fontes](../../src/components/guide-fact.tsx).

Inventários: [fontes botânicas](../../data/guia/fontes_botanicas.csv), [imagens](../../data/guia/imagens_referencia.csv). Consulte [metodologia](METODOLOGIA.md), [fontes botânicas](FONTES_BOTANICAS.md), [fontes visuais](FONTES_VISUAIS.md), [licenças](LICENCAS.md), [revisão pendente](REVISAO_PENDENTE.md) e [metodologia geral](../metodologia/01-visao-geral.md).

Não foram alterados mapa, banco, importação, registro ou moderação. Fotos do guia são referências independentes dos registros do mapa. Recomendações fotográficas são opcionais.

Reprodução: Node >=22.12; node scripts/guia-taxonomy.mjs consulta a lista oficial; node scripts/guia-research.mjs registra buscas visuais; node scripts/guia-images.mjs baixa seleções com validação de licença e otimiza; --offline recompõe manifestos usando evidência e arquivos locais. node scripts/guia-docs.mjs atualiza inventários/documentação. Não executar atualização de fontes sem revisar novamente conteúdo e licenças. Assets existentes são preservados; para substituir uma foto, revisar a seleção, evidência e arquivo local como uma única mudança.

O componente de fotos trata ausência e erro de carregamento, preservando a atribuição de arquivos existentes. Next/Image fornece dimensões, otimização e carregamento preguiçoso; só o comparador e tratamento de falha exigem interação no navegador. Sem consultas ao banco ou imagens remotas durante o uso do guia.
