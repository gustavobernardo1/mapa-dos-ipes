# Ações que ainda precisam de você

1. **Abrir o arquivo privado .local-data/admin/primeiro-admin.txt**, guardar a senha em seu gerenciador e entrar em http://127.0.0.1:3000/admin. A conta contatomapadosipes@gmail.com já foi criada com app_metadata.role=admin; login e acesso à moderação foram verificados. Remover o arquivo de senha depois de guardá-la.
2. **Conectar o repositório à Vercel**, Node 22; preencher as variáveis públicas/privadas da lista exata no [README](../README.md), definir origem HTTPS e domínio/DNS se houver. Não criar token Vercel. No MapTiler, [API keys](https://cloud.maptiler.com/account/keys/) → Edit → Allowed HTTP origins: usar o domínio publicado. Para produção, usar chave própria restrita ao domínio; não manter localhost nessa chave.
3. **Fazer o primeiro registro com foto real autorizada**, testar câmera/GPS e GPS negado em seu aparelho, moderar e conferir mapa/galeria/histórico. Revisar responsável, contato, privacidade/licença/retenção e conteúdo botânico antes de abrir a campanha.

.env.local já foi preenchido; URL, publishable/secret, conexão, sessão e MapTiler estão configurados. A CA pública do Supabase foi baixada e configurada localmente para TLS verificado. Não é necessário copiar chaves novamente nem alterar MapTiler para testar localmente.

Migrations, bucket privado, grants e policies foram aplicados automaticamente. Os testes reais SQL de PostGIS/RLS/Storage e o fluxo de navegador com Supabase/Auth/Storage passaram. Todas as fixtures temporárias foram removidas. A validação usou imagens sintéticas de teste; ainda não há registros reais.
