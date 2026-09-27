# Lançamento

## Campanha 2026

**🌼 A florada está acabando. Vamos registrá-la.**

Ajude a construir um retrato colaborativo da florada dos ipês de Goiânia. Ainda dá tempo de ajudar a registrar os ipês que estão colorindo Goiânia em 2026.

CTA: **Registrar um ipê** → `/registrar`.

**Tem fotos antigas dos ipês de Goiânia?** Elas também contam uma parte da história. Confira data e local e compartilhe seu registro.

CTA: **Adicionar foto antiga** → `/registrar?origem=historica`.

## Instagram

Criar manualmente; disponibilidade dos nomes não foi verificada.

Nome: **Mapa dos Ipês**. Sugestões: `@mapadosipes`, `@mapadosipesgyn`, `@mapavivodosipes`.

Bio sugerida (ajustar ao limite da plataforma):

> 🌼 Mapeando a florada de Goiânia  
> 📷 Fotografe um ipê e contribua  
> 🌳 Ciência cidadã + tecnologia  
> 🛰️ Construindo dados para observar a cidade de outra forma

### Publicação 1 — apresentação

Goiânia tem histórias que florescem pelas ruas. 🌼 O Mapa dos Ipês começa com uma proposta simples: reunir fotografias, datas e locais dos ipês da cidade. A florada de 2026 está acabando, mas ainda dá tempo de registrá-la. Fotografe uma árvore e ajude a construir esse retrato coletivo. Link na bio, após publicar o site.

### Publicação 2 — como participar

Viu um ipê? 📷 Faça uma foto da árvore e das flores. No Mapa dos Ipês, escolha “Fotografar agora”, confira o ponto no mapa e conte a cor e o estado da floração. Não sabe a espécie? Pode marcar “Não sei”. Fotos antigas também são bem-vindas: informe a data e o local. Cada registro passa por moderação antes de aparecer publicamente.

### Publicação 3 — por que sua foto ajuda

Uma foto tem um lugar e um instante. 🌳 Ao observar a mesma árvore em diferentes datas, construímos um histórico da floração. No futuro, registros verificados poderão apoiar estudos com séries temporais de satélite. Ainda não há um modelo de detecção funcionando no projeto: primeiro precisamos de boas perguntas, dados e validação. Sua contribuição ajuda a começar.

### Stories

1. Foto real autorizada + “A florada está acabando. Vamos registrá-la?” + link do site.
2. Três telas reais: fotografia → local → cor/floração.
3. “Tem um ipê de outro ano no rolo da câmera?” + link de foto histórica.
4. “Não sabe se é ipê? Tudo bem: fotografe as folhas e as flores.” + guia.
5. “Galeria não é validação científica automática” + explicação simples da moderação.

Usar apenas fotos reais autorizadas ou imagens explicitamente ilustrativas. Não publicar estatísticas de demonstração, mapas fictícios nem promessas de IA pronta.

## Infraestrutura para publicação

Supabase Database/PostGIS + Auth + Storage; Next.js Node na Vercel. O bucket privado fotos e suas policies são criados por migration. Variáveis públicas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_MAPTILER_KEY opcional. Privadas no runtime: SUPABASE_SECRET_KEY e SESSION_SECRET; configurações: DATA_BACKEND=supabase e SUPABASE_STORAGE_BUCKET=fotos. DATABASE_URL é somente para migrations/testes locais. Lista exata e primeiro admin no [README](../README.md); ações restantes em [TAREFAS_MANUAIS](TAREFAS_MANUAIS.md).

## Checklist operacional

- [ ] Registrar `mapadosipes.com.br` (ação e possível custo de domínio).
- [ ] Criar e-mail do projeto e publicar um canal de contato funcional.
- [ ] Configurar DNS conforme os valores fornecidos pela hospedagem.
- [ ] Conectar domínio e conferir HTTPS.
- [ ] Ajustar `NEXT_PUBLIC_SITE_URL` para o domínio final e redesploy.
- [ ] Criar Instagram e revisar disponibilidade do nome.
- [ ] Ativar 2FA nas contas de hospedagem, Supabase, domínio, e-mail e rede social.
- [ ] Revisar botânica, privacidade, licenças e retenção antes de aceitar contribuições públicas.
- [ ] Após preencher .env.local, validar automaticamente migrations, RLS, PostGIS e Supabase Storage com npm run db:migrate, npm run db:test e npm run test:supabase.
- [ ] Tirar fotografias reais, cadastrar os primeiros exemplares e moderar.
- [ ] Testar câmera, GPS permitido/negado, instalação PWA e teclado em aparelhos reais.
- [ ] Monitorar franquias, pausas e disponibilidade; nenhum plano pago é requisito do código.

Supabase Free pode pausar projetos com pouca atividade; ver [política oficial](https://supabase.com/docs/guides/platform/free-project-pausing). Confirmar os limites dos serviços no momento do lançamento. O projeto Supabase já foi criado pelo responsável. Esta migração não criou contas permanentes, registrou domínio, publicou site ou enviou mensagens.
