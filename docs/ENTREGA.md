# Entrega — infraestrutura real

**Supabase Database/PostGIS + Auth + Storage privado configurados e validados no projeto real.** MapTiler validado com as origens locais; Next.js preparado para Vercel. Nenhum deploy foi feito.

## Implementado

- SDK AWS, adaptador/variáveis obrigatórias de R2 e instruções antigas removidos.
- PhotoStorage com implementações Supabase e local; bucket fotos privado.
- Policies restritivas de Storage e grants explícitos compatíveis com exposição automática desabilitada.
- Chaves modernas publishable/secret; produção proíbe local e não faz fallback com configuração incompleta.
- Fotos validadas por MIME/extensão/decoder, auto-orientadas, sem EXIF público; WebP 1800 px qualidade 88 + thumb 480 px qualidade 82, hash SHA-256 e caminhos por observação.
- Migrations com TLS verificado, lock, checksums e histórico privado; sem reset.
- Documentação de primeiro administrador, Vercel e restrições MapTiler.

## Validação local

Lint, typecheck, build, **11 testes unitários** e **8 testes Playwright mobile/desktop passaram**. Os testes locais cobrem cadastro, privacidade de pendentes/rejeitados, aprovação, mapa/galeria e histórico.

## Validação real — 26/09/2026

- Conexão PostgreSQL com verificação de CA e hostname. Foi configurado DATABASE_SSL_CA_PATH para a CA pública do Supabase em diretório local ignorado; verificação TLS permanece habilitada.
- Três migrations aplicadas. Nova execução reconheceu os checksums e não reaplicou DDL nem seeds.
- PostGIS validado, índices GiST presentes.
- Testes SQL reais de RLS, bloqueio de RPC privilegiada, role, privacidade, policies Storage contra policy permissiva, raio 10 m, viewport, estatísticas, aprovação/associação transacionais e histórico: passaram.
- Navegador real: cadastro atual → upload Supabase Storage → pendente privado → login Supabase Auth → aprovação → galeria/ficha/histórico: passou.
- Foto histórica com EXIF e correção de data, associação à mesma árvore e moderação: passou.
- MapTiler retornou HTTP 200 para as origens locais; o navegador recebeu estilo e tiles reais durante o fluxo completo. O teste de servidor foi corrigido para enviar Origin/Referer; o 403 anterior foi observado em requisição sem origem.
- Fixtures SQL fizeram rollback; objetos, conta Auth temporária e registros do teste de navegador foram removidos. Conferência após limpeza: zero árvores, observações, fotos, administradores ou contas temporárias.

Esses testes usam imagens sintéticas, não são os primeiros registros reais do projeto. Câmera/GPS de aparelho físico e publicação Vercel ainda dependem do responsável.

Administrador permanente criado: contatomapadosipes@gmail.com, com app_metadata.role=admin. Login por senha no Supabase e autorização da API de moderação foram verificados. Senha gerada salva somente em .local-data/admin/primeiro-admin.txt, ignorado pelo Git; nenhum e-mail foi enviado e nenhum valor de credencial foi exibido.

.env.local está ignorado e não tracked. Chaves e conexão foram lidas diretamente do ambiente; valores não foram exibidos. A verificação dos arquivos públicos do build não encontrou os valores configurados de SUPABASE_SECRET_KEY, SUPABASE_ACCESS_TOKEN, DATABASE_URL ou SESSION_SECRET. A busca por padrões de segredo não prova ausência de toda forma de segredo.

## Operação

Executar npm run dev e abrir http://127.0.0.1:3000. Administração em /admin com a conta criada e as credenciais do arquivo privado. O teste não deixa usuário/senha padrão.

Comandos: infra:status, db:migrate, db:test, test:supabase. Pare outros servidores Next dev antes do teste de navegador. Não criar bucket/policies manualmente nem ressetar o banco.

Lista exclusiva de ações restantes: [TAREFAS_MANUAIS](TAREFAS_MANUAIS.md). Arquitetura, proteção e schema: [ARQUITETURA](ARQUITETURA.md), [SEGURANCA](SEGURANCA.md) e [BANCO](BANCO.md).
