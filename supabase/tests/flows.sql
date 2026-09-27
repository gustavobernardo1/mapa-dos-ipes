-- Real PostGIS/RPC workflow. No files uploaded; all database fixtures roll back.
begin;
select set_config('ipes.test.admin',gen_random_uuid()::text,true);
select set_config('ipes.test.ordinary',gen_random_uuid()::text,true);
insert into auth.users(id,raw_app_meta_data) values
(current_setting('ipes.test.admin')::uuid,'{"role":"admin"}'),
(current_setting('ipes.test.ordinary')::uuid,'{}');
select set_config('request.jwt.claims','{"role":"service_role"}',true);
set local role service_role;
do $$
declare oid uuid:=gen_random_uuid(); fid uuid:=gen_random_uuid(); aid uuid; old_oid uuid:=gen_random_uuid(); baseline bigint; after_count bigint; result jsonb; historical jsonb; payload jsonb; decision jsonb;
begin
  baseline:=(public.estatisticas()->>'arvores')::bigint;
  payload:=jsonb_build_object('latitude',-16.686,'longitude',-49.264,'data_observacao',current_date,'origem','CAMPO_ATUAL','status_floracao','INTENSA','cor_observada','AMARELO','identificacao_usuario','PROVAVEL','bairro','Teste SQL');
  result:=public.enviar_registro(payload,jsonb_build_object('id',fid,'observacao_id',oid,'key','observacoes/'||oid||'/web.webp','thumbnail_key','observacoes/'||oid||'/thumb.webp','hash_arquivo',md5(oid::text)||md5(fid::text),'largura',1800,'altura',1200),'{}');
  if result->>'status'<>'PENDENTE' then raise exception 'Submission not pending'; end if;
  if public.foto_autorizada('observacoes/'||oid||'/web.webp',false) then raise exception 'Pending photo authorized'; end if;
  select arvore_id into aid from public.observacoes where id=oid;
  if public.arvore_ficha(aid) is not null then raise exception 'Pending ficha exposed'; end if;
  decision:='{"status":"APROVADO","cor":"AMARELO","confianca":"B","especie_id":null}';
  begin
    perform public.moderar_registro(oid,decision,current_setting('ipes.test.ordinary')::uuid);
    raise exception 'Ordinary user approved';
  exception when raise_exception then
    if sqlerrm<>'Sem permissao' then raise; end if;
  end;
  perform public.moderar_registro(oid,decision,current_setting('ipes.test.admin')::uuid);
  after_count:=(public.estatisticas()->>'arvores')::bigint;
  if after_count<>baseline+1 then raise exception 'Approval/statistics not atomic'; end if;
  if not public.foto_autorizada('observacoes/'||oid||'/web.webp',false) then raise exception 'Approved photo hidden'; end if;
  if not exists(select 1 from jsonb_array_elements(public.arvores_consulta('{"lat":-16.686,"lng":-49.264,"radius":10,"limit":500}')) e where e->>'id'=aid::text) then raise exception '10m query failed'; end if;
  if exists(select 1 from jsonb_array_elements(public.arvores_consulta('{"lat":-16.696,"lng":-49.264,"radius":10,"limit":500}')) e where e->>'id'=aid::text) then raise exception '10m radius inaccurate'; end if;
  if not exists(select 1 from jsonb_array_elements(public.arvores_consulta('{"west":-49.265,"east":-49.263,"south":-16.687,"north":-16.685,"limit":500}')) e where e->>'id'=aid::text) then raise exception 'Viewport query failed'; end if;
  begin
    perform public.moderar_registro(oid,decision,current_setting('ipes.test.admin')::uuid);
    raise exception 'Repeated moderation succeeded';
  exception when raise_exception then
    if sqlerrm<>'Registro indisponivel' then raise; end if;
  end;
  historical:=payload||jsonb_build_object('arvore_id',aid,'origem','FOTO_HISTORICA','data_observacao','2023-09-01','status_floracao','SEM_FLORES');
  perform public.enviar_registro(historical,jsonb_build_object('id',gen_random_uuid(),'observacao_id',old_oid,'key','observacoes/'||old_oid||'/web.webp','thumbnail_key','observacoes/'||old_oid||'/thumb.webp','hash_arquivo',md5(old_oid::text)||md5(old_oid::text),'largura',1000,'altura',800),'{"data_exif":"2023-09-01T12:00:00Z","latitude_exif":-16.686,"longitude_exif":-49.264}');
  perform public.moderar_registro(old_oid,decision,current_setting('ipes.test.admin')::uuid);
  if (public.estatisticas()->>'arvores')::bigint<>after_count then raise exception 'Historical association created duplicate tree'; end if;
  result:=public.arvore_ficha(aid);
  if jsonb_array_length(result->'observacoes')<>2 or result->'observacoes'->0->>'data_observacao'<>current_date::text then raise exception 'Historical timeline incorrect'; end if;
  if result::text like '%data_exif%' then raise exception 'EXIF leaked into public ficha'; end if;
  if not exists(select 1 from privado.moderacoes where observacao_id=old_oid) then raise exception 'Audit record missing'; end if;
end; $$;
reset role;
rollback;
