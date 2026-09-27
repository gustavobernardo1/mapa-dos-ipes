# Arquitetura de informação do guia

O guia apresenta informações por aprofundamento progressivo. A refatoração altera navegação e apresentação; os fatos, táxons, sinônimos, fontes, pendências, fotos e licenças existentes são preservados.

| Nível                           | Experiência                                                                                 | Onde encontrar                                |
| ------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1. Reconhecimento visual        | Hero, quatro cards de ipês e três semelhantes, com uma pista por card                       | `/guia`                                       |
| 2. Pistas rápidas               | Foto principal, galeria ordenada, três pistas, semelhantes e floração resumida              | Ficha própria de cada grupo                   |
| 3. Comparação                   | Imagens árvore/árvore, flor/flor, folha/folha e fruto/fruto; depois três pistas comparáveis | `/guia/comparar`                              |
| 4. Informação botânica completa | Taxonomia, sinônimos e todos os caracteres; tabela completa de comparação                   | Acordeões fechados nas fichas e no comparador |
| 5. Fontes e metodologia         | Referências, limites editoriais, proveniência e créditos                                    | Acordeão “Fontes” e `/guia/fontes`            |

## Rotas

- `/guia/ipe-amarelo`
- `/guia/ipe-rosa`
- `/guia/ipe-roxo`
- `/guia/ipe-branco`
- `/guia/sibipiruna`
- `/guia/chuva-de-ouro`
- `/guia/ipe-de-jardim`
- `/guia/comparar`
- `/guia/como-fotografar`
- `/guia/fontes`

Os cards usam links “Conhecer” e não expandem conteúdo na página inicial. As fichas são pré-renderizadas; slugs desconhecidos retornam 404. Breadcrumbs e links permitem retornar ao guia e aprofundar sem concentrar tudo numa única página. O sitemap inclui as novas rotas.

## Fotografias e informação visual

A capa usa apenas a referência classificada como árvore/copa. Não substituímos uma árvore ausente por close de flor. Ipê-amarelo, chuva-de-ouro e ipê-de-jardim ainda precisam de referência adequada para a capa; mostramos placeholder. Algumas fotos existentes mostram copa, sem árvore inteira, e isso é declarado na interface. As fotos de flor, folha, casca e fruto são usadas apenas no respectivo órgão. Ausências e erros mantêm fallback; erros de carregamento mantêm os créditos do arquivo.

A galeria segue árvore/copa → flor → folha → casca → fruto. No celular, apenas a galeria tem rolagem horizontal, com encaixe suave; a página não exige rolagem horizontal. O comparador mantém as duas referências lado a lado. A tabela técnica adapta as linhas para duas colunas identificadas no celular, com cabeçalhos semânticos preservados.

As três pistas rápidas reutilizam os fatos originais sobre flor, folha e fruto. São pistas de observação, sem alegação de exclusividade diagnóstica. Rosa/roxo conserva o aviso de sobreposição. A comparação branca conserva a ressalva regional e não afirma ocorrência de T. elliptica em Goiânia. Nenhum conteúdo científico é preenchido para completar a apresentação.

## Aprofundamento e atribuição

“Identificação detalhada”, “Fontes” e “Ver comparação botânica completa” usam `details/summary` nativos, fechados inicialmente e acionáveis por teclado. A troca do par comparado fecha novamente a tabela. O aviso discreto “Guia em revisão botânica.” leva à explicação completa; não elimina as pendências de cada fato.

Crédito, origem, licença e alterações continuam junto a cada fotografia. A página pública de fontes reúne todas as referências e os créditos das 16 fotos. O resumo fotográfico inicial usa cinco ícones e títulos; a página própria preserva as instruções opcionais, sem modificar exigências de cadastro.

## Implementação e manutenção

Base científica única: `src/content/guide.ts`; manifesto visual: `src/content/guide-images.json`. Navegação e escolha de capas: `src/content/guide-navigation.ts`. Componentes reutilizáveis: `GuideCard`, `GuidePhotography`, `GuidePhoto`, `GuideFact` e `GuideComparator`. Layout compartilhado em `src/app/guia/layout.tsx`; apresentação em `guide.css` e `experience.css`, limitada às rotas do guia.

Não há consulta ao banco nem carregamento de imagens remotas durante o uso. Next/Image mantém otimização e carregamento preguiçoso das galerias. Os detalhes completos chegam no HTML, mas ficam visualmente recolhidos; isso preserva fontes e acesso sem carregar tudo na experiência inicial. O comparador continua usando interatividade local.

O gerador `scripts/guia-docs.mjs` foi atualizado para documentar esta arquitetura. Não foi necessário regenerar inventários, consultar fontes novamente ou substituir imagens. Checks e capturas estão em [VALIDACAO.md](VALIDACAO.md).

Refinamentos futuros: referências licenciadas de árvore inteira para completar capas, fotos dos órgãos pendentes e validação com usuários de campo. Revisão botânica permanece uma etapa independente da refatoração visual.
