# Banco e migrations

PostgreSQL/PostGIS no Supabase. Data API habilitada; exposição automática de tabelas desabilitada e RLS automático são suportados pelos grants explícitos.

| Migration                         | Conteúdo                                                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 202609260000_migration_ledger.sql | Schema privado, histórico de aplicação e RLS                                                                    |
| 202609260001_mvp.sql              | PostGIS, enums, tabelas, FKs, índices, RLS, catálogo/campanha e RPCs                                            |
| 202609260002_storage_grants.sql   | Grants explícitos de schemas/tabelas/sequence, bucket privado, policies restritivas e constraints de fotos/EXIF |

```powershell
npm run db:migrate
npm run db:test
```

DATABASE_URL vem de .env.local, nunca de argumento impresso. TLS verifica certificado; DATABASE_SSL_CA_PATH opcional. Runner serializa com advisory lock, mantém checksum e ledger na mesma transação da DDL, ignora versões já aplicadas e não faz reset. Schema preexistente sem ledger ou migration aplicada alterada interrompe para inspeção; não há adoção silenciosa. Use este runner como fonte do histórico; não misture execução manual/CLI sem reconciliar.

| Entidade                     | Uso                                                           |
| ---------------------------- | ------------------------------------------------------------- |
| especies / campanhas         | Catálogo provisório ativo e campanha 2026                     |
| arvores                      | UUID, código GYN, geography Point WGS84, classificação/status |
| observacoes                  | Data real, origem, ponto declarado, fenologia, moderação      |
| fotos                        | Keys Storage, URL via API, SHA-256 único, dimensões e thumb   |
| perfis                       | Referência a Auth, preparado para colaboradores futuros       |
| classificacoes               | Preparação de modelos; nenhum ML executado                    |
| privado.fotos_metadata       | Data/GPS EXIF privados                                        |
| privado.moderacoes           | Auditoria, moderador Auth e decisão                           |
| privado.limites              | Chaves HMAC efêmeras do limitador                             |
| privado.migrations_aplicadas | Versionamento operacional com checksum                        |

Seed só contém campanha e três grupos provisórios. Sem árvores, fotos ou observações de demonstração. Constraints limitam ponto, datas, textos, enums e dimensões; novos objetos devem usar caminho da observação e hash SHA-256. Constraints adicionadas NOT VALID preservam registros legados, aplicando-se a novas escritas. Não há trigger customizado: consistência/status/histórico são tratados pelas transações RPC. O gatilho automático de RLS do Supabase pode coexistir; as migrations também habilitam RLS explicitamente.

RPCs públicas security invoker: arvores_consulta, arvore_ficha, estatisticas, galeria_consulta, especies_publicas; helpers respeitam RLS. ST_DWithin usa metros/índice geography GiST, viewport usa envelope EPSG:4326/índice geometry GiST. Raio de duplicatas público 10 m, candidatas admin 30 m, associação pública até 100 m.

RPCs service_role: enviar_registro, moderacao_pendentes, moderar_registro, foto_autorizada, limitar_envios e helper privado. Público escreve através da API validada; não há grant/policy de escrita direta. Moderação verifica admin no banco, bloqueia a observação e rejeita segunda decisão. Atualizações de status/timestamps são feitas explicitamente nessas funções.

Teste local de parser SQL não executa PostGIS/RLS. db:test executa security.sql (isolamento de pendentes, writes, claims, policies Storage contra policy permissiva, RLS/índices) e flows.sql (submissão/aprovação, raio 10 m, viewport, estatísticas, associação histórica, auditoria e ordem temporal). Fixtures fazem rollback; sequences avançam normalmente. Nenhum reset ou remoção de dados reais.
