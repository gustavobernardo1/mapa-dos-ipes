# Validação do guia — 27/09/2026

Implementação validada em Node 22.23.3 e Next.js 16.3.6. A validação técnica não substitui a revisão botânica indicada em [REVISAO_PENDENTE.md](REVISAO_PENDENTE.md).

Resultados:

- ESLint: passou, sem erros ou avisos.
- Vitest: 24 testes em 10 arquivos passaram, incluindo integridade dos fatos, referências, licenças, evidência Commons e SHA-256 dos assets do guia.
- Build de produção: passou, incluindo TypeScript. `/guia` foi pré-renderizada como página estática.
- Playwright: 17 testes passaram, sendo 9 do guia e 8 dos fluxos existentes de cadastro, moderação, privacidade e navegação. Depois de abreviar os rótulos das fontes e ajustar carregamento das fotos, os 9 testes específicos do guia passaram novamente.

Larguras: mobile de 390 px, desktop de 1440 px e desktop de 1920 px. Verificados ausência de overflow horizontal, carregamento das fotos, créditos com links de origem e licença, fichas por teclado, seletores associados a rótulos, comparações prioritárias e livre, escolha duplicada e aviso rosa/roxo. Fallback verificado tanto para órgão sem foto quanto para falha simulada de carregamento; atribuição permanece visível. Comparação branca com T. elliptica mostra foto pendente em vez de substituto inventado.

Capturas inspecionadas:

- [Mobile — 390 px](../validacao/guia-390.png)
- [Desktop — 1440 px](../validacao/guia-1440.png)
- [Desktop — 1920 px](../validacao/guia-1920.png)

O teste usa backend local isolado e não escreve no Supabase de produção. Os fluxos existentes foram exercitados sem modificar suas regras.

Licenciamento: 16 fotos no app, 3 CC0, 11 CC BY e 2 CC BY-SA. Fontes potenciais sem autorização/licença individual comprovada ficaram fora do app. Identificação taxonômica das fotos segue declarada pelo repositório e pendente de especialista. Referências botânicas consultadas na pesquisa; testes de navegador verificam URLs e a ligação das fontes, sem depender da disponibilidade de sites externos em cada execução.

Carga: arquivos WebP locais com até 1280 px, dimensões conhecidas e Next/Image responsivo. Hero e primeira foto principal têm carregamento antecipado; as demais usam carregamento preguiçoso. A página usa conteúdo estático e não faz consultas ao banco. Tamanho total dos derivados e inventário em [FONTES_VISUAIS.md](FONTES_VISUAIS.md). Não foi medido tempo de rede em dispositivos físicos.

Limites: testes de teclado e semântica de HTML cobrem os controles principais; não constituem auditoria completa com leitores de tela. Calendário de Goiânia, duração de florada, campos sem fonte e identificação de indivíduos continuam pendentes. Nomes históricos e proveniência municipal foram preservados.

## Refatoração da arquitetura de informação — 27/09/2026

A entrada `/guia` agora contém quatro cards de ipês e três semelhantes, sem `details`, tabela ou seletores. “Conhecer” navega para uma ficha própria. Comparador, fotografia e fontes têm rotas dedicadas. Detalhamento em [ARQUITETURA_INFORMACAO.md](ARQUITETURA_INFORMACAO.md).

Validação desta refatoração:

- ESLint passou sem erros ou avisos; TypeScript (`tsc --noEmit`) e build de produção passaram.
- Os 24 testes unitários em 10 arquivos passaram, incluindo integridade dos fatos, referências, licenças e assets existentes.
- Playwright: 20 testes passaram, sendo 12 do guia (quatro cenários em três larguras) e oito dos fluxos existentes. Após ajuste do título da tabela no celular, os três cenários de comparação passaram novamente.
- Desktop de 1440 e 1920 px e mobile de 390 px: cards sem expansão, navegação por teclado, sete fichas, galeria ordenada com rolagem interna no celular, detalhes e fontes fechados, 404 para slug desconhecido, comparação visual e três pistas antes da tabela opcional.
- Comparador: atalhos prioritários e seletores livres; troca do par fecha a tabela; seleção repetida, sobreposição rosa/roxo e limite regional da comparação branca preservados. Tabela aberta sem overflow horizontal e título ocupando a largura disponível no celular.
- Fotografias: carregamento, placeholder por órgão ausente, falha de imagem com crédito preservado, atribuição junto à imagem e 16 créditos públicos. Dicas fotográficas continuam opcionais.

Capturas revisadas da nova entrada: [390 px](../validacao/guia-refatorado-390.png), [1440 px](../validacao/guia-refatorado-1440.png) e [1920 px](../validacao/guia-refatorado-1920.png). Comparador: [mobile](../validacao/guia-comparar-mobile.png), [desktop](../validacao/guia-comparar-desktop.png) e [desktop amplo](../validacao/guia-comparar-desktop-wide.png).

As sete fichas usam geração estática com slugs explícitos; entrada e três páginas auxiliares também foram pré-renderizadas. O comparador interage com conteúdo local. Nenhuma consulta ao banco é necessária no guia; detalhes recolhidos continuam no HTML. Fontes científicas, taxonomia, manifesto, licenças e imagens não foram reescritos. Testes de fluxo usam backend local isolado, sem escrita em produção.

Limite visual: algumas referências mostram apenas copa, declarada como tal. Ipê-amarelo, chuva-de-ouro e ipê-de-jardim não têm capa de árvore adequada no acervo atual; o placeholder não foi substituído por close de flor. Completar árvores inteiras e órgãos pendentes exige seleção de fotos com licença e evidência verificadas numa rodada própria.
