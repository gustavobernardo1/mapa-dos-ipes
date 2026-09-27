# Segurança

Leituras usam publishable no servidor, papel anon e RLS. Escritas, rate limit e Storage usam secret, papel service_role, exclusivamente em módulos do servidor chamados por Route Handlers. A secret contorna RLS; toda decisão administrativa é verificada antes de RPC privilegiada. [API Keys](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

Grants e RLS são complementares. Migrations concedem explicitamente acesso aos objetos deste aplicativo, inclusive service_role e sequence, sem depender dos grants automáticos de novas tabelas. Revogações não atingem tabelas alheias. Público lê catálogo ativo e árvores/observações/fotos aprovadas; não insere, atualiza confiança, modera, rejeita ou apaga diretamente. Helpers privados e RPCs de escrita não têm EXECUTE para PUBLIC/anon/authenticated. Todas as tabelas do app e o histórico de migrations têm RLS; privado não deve entrar nos schemas expostos da Data API.

Bucket fotos privado, WebP apenas, 4 MiB. Policies restritivas de SELECT/INSERT/UPDATE/DELETE negam anon e authenticated para esse bucket, inclusive diante de policies permissivas preexistentes. Outros buckets não são alterados. Clientes não listam, baixam, sobrescrevem ou apagam arquivos. Só /api/media entrega imagens aprovadas ou autorizadas ao admin. [Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control).

Admin: Supabase Auth, getUser em cada operação e app_metadata.role=admin. Cookie HttpOnly, SameSite=Strict, Secure em produção, até uma hora, sem refresh automático. Login novamente após expirar. Role em user_metadata é ignorada. Moderação também confirma o papel atual em auth.users dentro da transação e registra auditoria.

Primeiro admin: Authentication → Users → Add user → Create new user; copie seu UUID, use SQL Editor:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = 'UUID_REAL_DO_USUARIO';
```

Esse dado operacional é específico do usuário, não migration de schema. Não disponibilize esse comando no navegador. Use conta individual e 2FA nas contas do projeto. Revogação exige remover role e revogar sessões; claims já emitidas podem durar até expirar. A RPC de moderação verifica o papel atual no banco.

Login local só em desenvolvimento explícito: senha 12+, comparação constante, HMAC SESSION_SECRET 32+, uma hora. Não há credenciais padrão. Produção rejeita local.

Mutações exigem Origin igual ao endereço NEXT_PUBLIC_SITE_URL. Zod valida ponto, data não futura, enums, limites e consentimento. Multipart tem limite progressivo de 4 MiB + 128 KiB; MIME/extensão e formato decodificado devem concordar; SVG/animações e >40 MP são rejeitados. EXIF é removido da imagem publicada; apenas data/GPS relevante é retido em privado.

Rate limit persistente e atômico: 20 envios e 10 logins por hora. IP convertido em HMAC com SESSION_SECRET, nunca texto claro. Vercel/proxy deve sobrescrever X-Forwarded-For; outra hospedagem exige revisar a origem desse cabeçalho.

.env.local ignorado. NEXT_PUBLIC contém apenas dados públicos. Nunca logar process.env, headers, tokens, conexão, erro bruto de provedor ou stack que inclua esses valores. Scripts mostram presença/ausência e erros genéricos/códigos. TLS do PostgreSQL é verificado; CA opcional via DATABASE_SSL_CA_PATH. Sem rejectUnauthorized:false.

npm run secrets:scan examina fontes, padrões de chaves/URLs com credenciais e blobs do histórico Git. Arquivos privados de ambiente ignorados são permitidos; verifica-se que não estejam tracked. Dependências/builds/artefatos binários são excluídos. A busca por padrões tem limites; qualquer credencial real descoberta exige remoção e rotação. Na execução desta fase: nenhum padrão encontrado; zero arquivos tracked e nenhum commit.

npm run db:test executa tentativas negativas de escrita/leitura privada, RPC, Storage e role, consultas geoespaciais e aprovação/associação transacionais, com rollback. npm run test:supabase valida navegador/Auth/Storage real com fixtures próprias, sem traces/prints de valores. Esses testes passaram no Supabase real em 26/09/2026; fixtures SQL foram revertidas e objetos/conta/registros temporários do navegador foram removidos. A conexão usou CA pública e hostname verificados.

Antes de lançamento: criar administrador permanente, validar câmera/GPS em aparelho físico e revisar privacidade, contato, licença e retenção. Pedidos de remoção são atendidos pelo operador no banco e Supabase Storage com procedimento registrado; não há interface de apagamento no MVP.
