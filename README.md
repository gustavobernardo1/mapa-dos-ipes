# Mapa dos Ipês — Goiânia

MVP de ciência cidadã: cadastro fotográfico, mapa, moderação, galeria e histórico por árvore. Infraestrutura atual: **Supabase Database + PostGIS + Auth + Storage**, com Next.js Node.js na Vercel.

## Executar

Node **22.12+**, npm e Chrome para os testes de navegador.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Não sobrescreva um ambiente existente. Preencha o arquivo privado usando a tabela abaixo. Nunca envie valores ao chat. O projeto Supabase já foi criado; não é necessário criar outro.

```powershell
npm run infra:status
npm run db:migrate
npm run db:test
npm run dev
```

Abra http://127.0.0.1:3000 e use esse endereço em NEXT_PUBLIC_SITE_URL. O comando de status exibe apenas presença/ausência. Migrations criam também o bucket privado fotos: não crie policies manualmente.

Para desenvolvimento sem serviços, selecione explicitamente DATA_BACKEND=local. O diretório padrão é .local-data; login local exige LOCAL_ADMIN_PASSWORD de 12+ caracteres e SESSION_SECRET de 32+. Produção bloqueia local; configuração incompleta nunca ativa fallback silencioso.


## Banco e fotografias

Migrations versionadas habilitam PostGIS, criam tabelas, FKs, constraints, índices GiST, RPCs, RLS, grants explícitos e Storage privado. São compatíveis com Data API habilitada, grants automáticos desabilitados e RLS automático. [Mudança de defaults Supabase](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

db:migrate usa lock e histórico privado com checksums; não reseta dados. Se detectar schema existente sem seu histórico ou checksum divergente, interrompe para inspeção. Não misture aplicação manual/CLI e este runner sem reconciliar o histórico. db:test executa segurança e fluxos SQL com rollback; sequences podem avançar, deixando lacunas normais nos códigos.

Fotos: JPEG/JPG, PNG ou WebP até 4 MiB e 40 MP; MIME, extensão e decodificação conferidos. Auto-orientação, WebP principal até 1800 px, qualidade 88; thumb até 480 px, qualidade 82. Sem EXIF público. Hash SHA-256 do original; original descartado, metadados relevantes privados. Objetos: observacoes/{id}/web.webp e thumb.webp. Bucket privado fotos; entrega exclusivamente por /api/media após aprovação ou autorização administrativa.

## Primeiro administrador

1. Supabase → Authentication → Users → Add user → Create new user. Defina e-mail e senha individual; confirme o e-mail pelo painel se necessário.
2. No SQL Editor, substitua o UUID abaixo pelo ID desse usuário:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = 'UUID_REAL_DO_USUARIO';
```

3. Entre em /admin com e-mail/senha. user_metadata nunca concede administração. Veja [Segurança](docs/SEGURANCA.md).

## Verificar

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm run secrets:scan
npm run db:test
npm run test:supabase
```

Pare outros servidores Next dev antes dos testes. Playwright local usa fixtures isoladas e verifica mobile/desktop. test:supabase usa serviços reais e um servidor temporário na porta 3300: cria conta administrativa temporária, testa cadastro atual/histórico com correção EXIF, Storage, privacidade, aprovação, galeria e histórico; remove apenas suas próprias fixtures. Sem credenciais retorna bloqueio explícito. Use homologação sem alterações simultâneas. Esse teste sintético não substitui fotografia/câmera/GPS de um aparelho real. Não registra traces ou valores privados.

## Vercel

Importe o repositório → Next.js → Node 22 → npm ci → npm run build. Em **Project → Settings → Environment Variables**:

- Públicas: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SITE_URL; NEXT_PUBLIC_MAPTILER_KEY opcional.
- Privadas no runtime: SUPABASE_SECRET_KEY, SESSION_SECRET.
- Configuração do servidor: DATA_BACKEND=supabase, SUPABASE_STORAGE_BUCKET=fotos.

DATABASE_URL e DATABASE_SSL_CA_PATH são usados localmente para migrations/testes; não são necessários na Vercel. Não configure senha/diretório local nem token Vercel. Defina variáveis por ambiente, URL HTTPS exata e faça novo deploy após alterar NEXT_PUBLIC. Restrinja MapTiler pelos domínios de produção/homologação; a chave pública será visível no navegador. Sem ela o mapa usa OSM, preservando atribuição e a [política de tiles](https://operations.osmfoundation.org/policies/tiles/).

O runtime Node processa imagens com sharp e limita multipart a 4 MiB + overhead. Confirme os [limites da Vercel](https://vercel.com/docs/functions/limitations), franquias e adequação dos planos ao uso do projeto. Nenhum plano pago é exigido pelo código.

A infraestrutura Supabase real foi configurada e validada em 26/09/2026: migrations, PostGIS/RLS/Storage e fluxo de navegador atual/histórico passaram; fixtures foram removidas. MapTiler respondeu HTTP 200 com as origens locais. Administrador permanente criado e acesso à moderação verificado. Restam deploy e fotografia/GPS em aparelho físico. Consulte [Entrega](docs/ENTREGA.md), [ações restantes](docs/TAREFAS_MANUAIS.md), [Arquitetura](docs/ARQUITETURA.md), [Banco](docs/BANCO.md), [Segurança](docs/SEGURANCA.md), [Lançamento](docs/LANCAMENTO.md) e [Pesquisa](docs/PESQUISA.md).
