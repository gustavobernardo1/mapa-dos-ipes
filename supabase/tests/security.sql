-- Execute using npm run db:test against Supabase. Existing rows are untouched.
-- Every fixture is rolled back. Run only after applying the migration.
begin;
insert into public.arvores(id,localizacao,status) values
('00000000-0000-4000-8000-000000000001',extensions.st_setsrid(extensions.st_makepoint(-49.264,-16.686),4326)::extensions.geography,'PENDENTE'),
('00000000-0000-4000-8000-000000000002',extensions.st_setsrid(extensions.st_makepoint(-49.264,-16.686),4326)::extensions.geography,'APROVADO');
insert into public.observacoes(id,arvore_id,data_observacao,origem,status_floracao,cor_observada,identificacao_usuario,status_moderacao,latitude,longitude) values
('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','2023-09-01','FOTO_HISTORICA','INTENSA','AMARELO','PROVAVEL','PENDENTE',-16.686,-49.264),
('00000000-0000-4000-8000-000000000004','00000000-0000-4000-8000-000000000002','2023-09-01','FOTO_HISTORICA','INTENSA','AMARELO','PROVAVEL','APROVADO',-16.686,-49.264);
insert into public.fotos(id,observacao_id,url,key,thumbnail_key,hash_arquivo,largura,altura) values
('00000000-0000-4000-8000-000000000005','00000000-0000-4000-8000-000000000003','/api/media/test','observacoes/00000000-0000-4000-8000-000000000003/web.webp','observacoes/00000000-0000-4000-8000-000000000003/thumb.webp',repeat('a',64),100,100),
('00000000-0000-4000-8000-000000000006','00000000-0000-4000-8000-000000000004','/api/media/test','observacoes/00000000-0000-4000-8000-000000000004/web.webp','observacoes/00000000-0000-4000-8000-000000000004/thumb.webp',repeat('b',64),100,100);
insert into privado.fotos_metadata(foto_id,data_exif,latitude_exif,longitude_exif)
values('00000000-0000-4000-8000-000000000005','2023-09-01',-16.686,-49.264);
insert into storage.objects(id,bucket_id,name) values
('00000000-0000-4000-8000-000000000007','fotos','security-test/pending.webp');
-- Prove restrictive policies resist even an accidentally broad existing policy.
create policy security_test_permissive on storage.objects for all to anon,authenticated using(true) with check(true);
set local role anon;
do $$
begin
  if exists(select 1 from public.arvores where id='00000000-0000-4000-8000-000000000001') then raise exception 'Pending tree leaked'; end if;
  if exists(select 1 from public.observacoes where id='00000000-0000-4000-8000-000000000003') then raise exception 'Pending observation leaked'; end if;
  if not exists(select 1 from public.arvores where id='00000000-0000-4000-8000-000000000002') then raise exception 'Approved tree hidden'; end if;
  if public.arvore_ficha('00000000-0000-4000-8000-000000000001') is not null then raise exception 'RPC leaked pending tree'; end if;
  if jsonb_array_length(public.arvores_consulta('{"lat":-16.686,"lng":-49.264,"radius":10}')) < 1 then raise exception 'Spatial query failed'; end if;
  if has_function_privilege('anon','public.enviar_registro(jsonb,jsonb,jsonb)','EXECUTE') then raise exception 'Anonymous submit RPC accessible'; end if;
  if has_function_privilege('authenticated','public.moderar_registro(uuid,jsonb,uuid)','EXECUTE') then raise exception 'Unprivileged moderation RPC accessible'; end if;
  if has_table_privilege('anon','public.arvores','UPDATE') then raise exception 'Anonymous write allowed'; end if;
  if has_schema_privilege('anon','privado','USAGE') then raise exception 'Private schema accessible'; end if;
  if exists(select 1 from public.fotos where id='00000000-0000-4000-8000-000000000005') then raise exception 'Pending photo leaked'; end if;
  if not exists(select 1 from public.fotos where id='00000000-0000-4000-8000-000000000006') then raise exception 'Approved photo hidden'; end if;
  begin
    update public.arvores set confianca='A' where id='00000000-0000-4000-8000-000000000002';
    raise exception 'Public confidence update succeeded';
  exception when insufficient_privilege then null; end;
  begin
    perform public.moderacao_pendentes();
    raise exception 'Private RPC accessible';
  exception when insufficient_privilege then null; end;
  begin
    if exists(select 1 from storage.objects where bucket_id='fotos') then raise exception 'Storage listing leaked'; end if;
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects(bucket_id,name) values('fotos','security-test/forbidden.webp');
    raise exception 'Public storage upload succeeded';
  exception when insufficient_privilege then null; end;
  begin
    update storage.objects set name='security-test/overwritten.webp' where id='00000000-0000-4000-8000-000000000007';
    if found then raise exception 'Storage overwrite succeeded'; end if;
  exception when insufficient_privilege then null; end;
  begin
    delete from storage.objects where id='00000000-0000-4000-8000-000000000007';
    if found then raise exception 'Storage deletion succeeded'; end if;
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated","user_metadata":{"role":"admin"},"app_metadata":{}}',true);
do $$ begin
  if public.e_admin() then raise exception 'User metadata elevated role'; end if;
  if exists(select 1 from public.observacoes where id='00000000-0000-4000-8000-000000000003') then raise exception 'Authenticated pending leak'; end if;
  begin
    perform public.moderar_registro('00000000-0000-4000-8000-000000000003','{}','00000000-0000-4000-8000-000000000009');
    raise exception 'Authenticated moderation allowed';
  exception when insufficient_privilege then null; end;
  begin
    if exists(select 1 from storage.objects where bucket_id='fotos') then raise exception 'Authenticated storage leak'; end if;
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects(bucket_id,name) values('fotos','security-test/auth-forbidden.webp');
    raise exception 'Authenticated upload allowed';
  exception when insufficient_privilege then null; end;
end; $$;
reset role;
do $$ begin
  if not exists(select 1 from storage.buckets where id='fotos' and not public) then raise exception 'Private bucket missing'; end if;
  if not exists(select 1 from pg_class where oid='storage.objects'::regclass and relrowsecurity) then raise exception 'Storage RLS disabled'; end if;
  if (select count(*) from pg_indexes where schemaname='public' and tablename='arvores' and indexdef ilike '%using gist%')<2 then raise exception 'Spatial indexes missing'; end if;
  if exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','privado') and c.relname in ('especies','campanhas','arvores','observacoes','fotos','perfis','classificacoes','fotos_metadata','moderacoes','limites') and not c.relrowsecurity) then raise exception 'Application RLS disabled'; end if;
end; $$;
rollback;
