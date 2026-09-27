-- Explicit opt-in grants: compatible with Supabase secure defaults.
-- Never alter permissions on unrelated application tables or buckets.
begin;
grant usage on schema public,extensions to anon,authenticated,service_role;
grant usage on schema privado to service_role;
grant all on public.especies,public.campanhas,public.arvores,public.observacoes,
  public.fotos,public.perfis,public.classificacoes,
  privado.fotos_metadata,privado.moderacoes,privado.limites to service_role;
grant usage,select on sequence public.codigo_arvore to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('fotos','fotos',false,4194304,array['image/webp'])
on conflict(id) do update set public=false,file_size_limit=4194304,allowed_mime_types=array['image/webp'];

-- Restrictive policies intersect every permissive policy, including pre-existing
-- broad grants. Only the server secret (BYPASSRLS) accesses this private bucket.
create policy fotos_no_client_select on storage.objects as restrictive
  for select to anon,authenticated using(bucket_id<>'fotos');
create policy fotos_no_client_insert on storage.objects as restrictive
  for insert to anon,authenticated with check(bucket_id<>'fotos');
create policy fotos_no_client_update on storage.objects as restrictive
  for update to anon,authenticated using(bucket_id<>'fotos') with check(bucket_id<>'fotos');
create policy fotos_no_client_delete on storage.objects as restrictive
  for delete to anon,authenticated using(bucket_id<>'fotos');

-- Defense in depth for direct RPC invocation: images must belong to the same
-- observation path and EXIF coordinates cannot exceed physical bounds.
alter table public.fotos add constraint fotos_hash_sha256 check(hash_arquivo ~ '^[a-f0-9]{64}$') not valid;
alter table public.fotos add constraint fotos_keys_observacao check(
  key='observacoes/'||observacao_id::text||'/web.webp' and
  thumbnail_key='observacoes/'||observacao_id::text||'/thumb.webp'
) not valid;
alter table privado.fotos_metadata add constraint metadata_latitude check(latitude_exif between -90 and 90) not valid;
alter table privado.fotos_metadata add constraint metadata_longitude check(longitude_exif between -180 and 180) not valid;
-- NOT VALID preserves any existing legacy records; constraints enforce new writes.
commit;
