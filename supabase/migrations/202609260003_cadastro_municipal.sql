-- Cadastro municipal separado de confirmação comunitária. Não insere árvores.
begin;
alter table public.arvores
  add column origem_municipal boolean not null default false,
  add column status_validacao text not null default 'REGISTRO_COMUNITARIO' check(status_validacao in ('REGISTRO_COMUNITARIO','CADASTRO_PUBLICO')),
  add column status_verificacao_comunitaria text not null default 'NAO_VERIFICADA' check(status_verificacao_comunitaria in ('NAO_VERIFICADA','VERIFICADA_FOTOGRAFICAMENTE')),
  add column verificado_comunidade_em timestamptz,
  add column descricao_municipal text,
  add column cor_cadastral public.cor_flor,
  add column proveniencia_municipal jsonb,
  add constraint origem_municipal_consistente check(not origem_municipal or (status_validacao='CADASTRO_PUBLICO' and proveniencia_municipal is not null));

create table privado.cadastros_municipais (
  fonte text not null check(fonte='PREFEITURA_GOIANIA'),
  dataset text not null check(dataset='MAPA_MEIO_AMBIENTE'),
  layer text not null check(layer='ARVORE'), layer_id integer not null check(layer_id=3),
  objectid bigint not null, arvore_id uuid not null unique references public.arvores(id) on delete restrict,
  codigo_especie integer not null check(codigo_especie in (16,36,118,119,166,175,176,306)),
  descricao text not null, nome_cientifico text not null,
  geometria_original extensions.geometry(Point,31982) not null,
  geometria_arcgis_original jsonb not null, atributos_brutos jsonb not null,
  hash_payload text not null, fonte_data_consulta timestamptz not null,
  primary key(fonte,dataset,layer,objectid)
);
create table privado.cadastros_municipais_versoes (
  fonte text not null, dataset text not null, layer text not null, objectid bigint not null,
  hash_payload text not null, snapshot jsonb not null, registrado_em timestamptz not null default now(),
  primary key(fonte,dataset,layer,objectid,hash_payload),
  foreign key(fonte,dataset,layer,objectid) references privado.cadastros_municipais(fonte,dataset,layer,objectid) on delete restrict
);
alter table privado.cadastros_municipais enable row level security;
alter table privado.cadastros_municipais_versoes enable row level security;
revoke all on privado.cadastros_municipais,privado.cadastros_municipais_versoes from public,anon,authenticated;
grant select,insert,update on privado.cadastros_municipais to service_role;
grant select,insert on privado.cadastros_municipais_versoes to service_role;

create function privado.proteger_origem_municipal() returns trigger language plpgsql set search_path='' as $$
begin
  if tg_op='DELETE' then raise exception 'Origem historica nao pode ser apagada'; end if;
  if tg_table_name='cadastros_municipais_versoes' then raise exception 'Snapshot historico imutavel'; end if;
  if (new.fonte,new.dataset,new.layer,new.objectid,new.arvore_id) is distinct from (old.fonte,old.dataset,old.layer,old.objectid,old.arvore_id) then
    raise exception 'Chave de origem historica imutavel';
  end if;
  return new;
end; $$;
create trigger proteger_cadastro before update or delete on privado.cadastros_municipais for each row execute function privado.proteger_origem_municipal();
create trigger proteger_versao before update or delete on privado.cadastros_municipais_versoes for each row execute function privado.proteger_origem_municipal();

create function privado.proteger_arvore_municipal() returns trigger language plpgsql set search_path='' as $$
begin
  if old.origem_municipal and (not new.origem_municipal or new.status_validacao<>'CADASTRO_PUBLICO' or
    (new.proveniencia_municipal->'fonte',new.proveniencia_municipal->'dataset',new.proveniencia_municipal->'layer',new.proveniencia_municipal->'OBJECTID') is distinct from
    (old.proveniencia_municipal->'fonte',old.proveniencia_municipal->'dataset',old.proveniencia_municipal->'layer',old.proveniencia_municipal->'OBJECTID')) then
    raise exception 'Origem municipal deve ser preservada';
  end if;
  return new;
end; $$;
create trigger proteger_arvore_origem before update on public.arvores for each row execute function privado.proteger_arvore_municipal();

create function privado.atualizar_verificacao_municipal() returns trigger language plpgsql security definer set search_path='' as $$
declare aid uuid; previous_aid uuid; verified boolean;
begin
  if tg_table_name='observacoes' then
    if tg_op<>'DELETE' then aid:=new.arvore_id; end if;
    if tg_op<>'INSERT' then previous_aid:=old.arvore_id; end if;
  else
    if tg_op<>'DELETE' then select arvore_id into aid from public.observacoes where id=new.observacao_id; end if;
    if tg_op<>'INSERT' then select arvore_id into previous_aid from public.observacoes where id=old.observacao_id; end if;
  end if;
  for aid in select distinct v from unnest(array[aid,previous_aid]) v where v is not null loop
    select exists(select 1 from public.observacoes o join public.fotos f on f.observacao_id=o.id where o.arvore_id=aid and o.status_moderacao='APROVADO') into verified;
    update public.arvores set status_verificacao_comunitaria=case when verified then 'VERIFICADA_FOTOGRAFICAMENTE' else 'NAO_VERIFICADA' end,
      verificado_comunidade_em=case when verified then coalesce(verificado_comunidade_em,now()) else null end
      where id=aid and origem_municipal;
  end loop;
  return null;
end; $$;
create trigger verificar_observacao_municipal after insert or update or delete on public.observacoes for each row execute function privado.atualizar_verificacao_municipal();
create trigger verificar_foto_municipal after insert or update or delete on public.fotos for each row execute function privado.atualizar_verificacao_municipal();
revoke all on function privado.proteger_origem_municipal(),privado.proteger_arvore_municipal(),privado.atualizar_verificacao_municipal() from public,anon,authenticated;

drop policy arvores_aprovadas on public.arvores;
create policy arvores_aprovadas on public.arvores for select to anon,authenticated using (
  status='APROVADO' or (origem_municipal and status_validacao='CADASTRO_PUBLICO' and status<>'REJEITADO')
);
create or replace function public.arvore_json(alvo uuid) returns jsonb language sql stable security invoker set search_path='' as $$
  select (to_jsonb(a)-'localizacao') || jsonb_build_object(
    'latitude',extensions.st_y(a.localizacao::extensions.geometry),'longitude',extensions.st_x(a.localizacao::extensions.geometry),
    'nome_popular',coalesce(e.nome_popular,a.descricao_municipal,'Ipê provável'),
    'observacoes',coalesce((select jsonb_agg(public.observacao_publica(o.id) order by o.data_observacao desc,o.criado_em desc) from public.observacoes o where o.arvore_id=a.id),'[]'::jsonb))
  from public.arvores a left join public.especies e on e.id=a.especie_id where a.id=alvo;
$$;
create or replace function public.arvore_ficha(alvo uuid) returns jsonb language sql stable security invoker set search_path='' as $$
  select public.arvore_json(a.id) from public.arvores a where a.id=alvo and ((a.origem_municipal and a.status_validacao='CADASTRO_PUBLICO' and a.status<>'REJEITADO') or (a.status='APROVADO' and exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO')));
$$;
create or replace function public.arvores_consulta(filtros jsonb default '{}') returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(resultado),'[]'::jsonb) from (
    select public.arvore_json(a.id) || case when filtros ? 'lat' then jsonb_build_object('distancia',extensions.st_distance(a.localizacao,extensions.st_setsrid(extensions.st_makepoint((filtros->>'lng')::float8,(filtros->>'lat')::float8),4326)::extensions.geography)) else '{}'::jsonb end as resultado
    from public.arvores a left join public.especies e on a.especie_id=e.id
    where ((a.origem_municipal and a.status_validacao='CADASTRO_PUBLICO' and a.status<>'REJEITADO') or (a.status='APROVADO' and exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO')))
      and (not filtros ? 'west' or extensions.st_intersects(a.localizacao::extensions.geometry,extensions.st_makeenvelope((filtros->>'west')::float8,(filtros->>'south')::float8,(filtros->>'east')::float8,(filtros->>'north')::float8,4326)))
      and (not filtros ? 'lat' or extensions.st_dwithin(a.localizacao,extensions.st_setsrid(extensions.st_makepoint((filtros->>'lng')::float8,(filtros->>'lat')::float8),4326)::extensions.geography,least(coalesce((filtros->>'radius')::float8,10),5000)))
      and (not filtros ? 'color' or a.cor_principal::text=filtros->>'color')
      and (not filtros ? 'species' or a.especie_id=(filtros->>'species')::uuid)
      and (not filtros ? 'confidence' or a.confianca::text=filtros->>'confidence')
      and (not filtros ? 'since' or exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO' and o.data_observacao>=(filtros->>'since')::date))
      and (coalesce(filtros->>'search','')='' or a.bairro ilike '%'||(filtros->>'search')||'%' or a.codigo_publico ilike '%'||(filtros->>'search')||'%' or a.descricao_municipal ilike '%'||(filtros->>'search')||'%' or e.nome_popular ilike '%'||(filtros->>'search')||'%')
      and (not coalesce((filtros->>'blooming')::boolean,false) or (
        select o.status_floracao in ('INTENSA','ALGUMAS','CAINDO') and o.data_observacao>=current_date-7 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO' order by o.data_observacao desc,o.criado_em desc limit 1))
    order by case when filtros->>'sort'='observations' then (select count(*) from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO') end desc,
      case when filtros ? 'lat' then extensions.st_distance(a.localizacao,extensions.st_setsrid(extensions.st_makepoint((filtros->>'lng')::float8,(filtros->>'lat')::float8),4326)::extensions.geography) end,
      a.atualizado_em desc, a.id
    limit greatest(1,least(coalesce((filtros->>'limit')::int,100),500)) offset greatest(coalesce((filtros->>'offset')::int,0),0)
  ) dados;
$$;
create or replace function public.estatisticas() returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'arvores',count(*),'amarelas',count(*) filter(where cor_principal='AMARELO'),
    'rosas_roxas',count(*) filter(where cor_principal='ROSA_ROXO'),'brancas',count(*) filter(where cor_principal='BRANCO'),
    'floridas',count(*) filter(where (select o.status_floracao in ('INTENSA','ALGUMAS','CAINDO') and o.data_observacao>=current_date-7 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO' order by o.data_observacao desc,o.criado_em desc limit 1)),
    'observacoes',(select count(*) from public.observacoes where status_moderacao='APROVADO'),
    'fotos',(select count(*) from public.fotos f join public.observacoes o on o.id=f.observacao_id where o.status_moderacao='APROVADO')
  ) from public.arvores a where ((a.origem_municipal and a.status_validacao='CADASTRO_PUBLICO' and a.status<>'REJEITADO') or (a.status='APROVADO' and exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO')));
$$;
create or replace function public.enviar_registro(dados jsonb,foto jsonb,metadados jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare aid uuid; oid uuid:=(foto->>'observacao_id')::uuid; fid uuid:=(foto->>'id')::uuid; point extensions.geography;
begin
  point:=extensions.st_setsrid(extensions.st_makepoint((dados->>'longitude')::float8,(dados->>'latitude')::float8),4326)::extensions.geography;
  if dados ? 'arvore_id' then
    select id into aid from public.arvores where id=(dados->>'arvore_id')::uuid and (status='APROVADO' or (origem_municipal and status_validacao='CADASTRO_PUBLICO' and status<>'REJEITADO')) and extensions.st_dwithin(localizacao,point,case when origem_municipal then 10 else 100 end) for share;
    if aid is null then raise exception 'Arvore invalida ou distante'; end if;
  else
    insert into public.arvores(localizacao,cor_principal,bairro) values(point,(dados->>'cor_observada')::public.cor_flor,coalesce(dados->>'bairro','')) returning id into aid;
  end if;
  insert into public.observacoes(id,arvore_id,campanha_id,data_observacao,origem,status_floracao,cor_observada,identificacao_usuario,comentario,nome_publico,bairro,latitude,longitude)
  values(oid,aid,(select id from public.campanhas where slug='IPES_GOIANIA_2026'),(dados->>'data_observacao')::date,dados->>'origem',dados->>'status_floracao',(dados->>'cor_observada')::public.cor_flor,dados->>'identificacao_usuario',coalesce(dados->>'comentario',''),coalesce(dados->>'nome_publico',''),coalesce(dados->>'bairro',''),(dados->>'latitude')::float8,(dados->>'longitude')::float8);
  insert into public.fotos(id,observacao_id,url,key,thumbnail_key,hash_arquivo,largura,altura)
  values(fid,oid,'/api/media/'||(foto->>'key'),foto->>'key',foto->>'thumbnail_key',foto->>'hash_arquivo',(foto->>'largura')::int,(foto->>'altura')::int);
  insert into privado.fotos_metadata(foto_id,data_exif,latitude_exif,longitude_exif)
  values(fid,(metadados->>'data_exif')::timestamptz,(metadados->>'latitude_exif')::float8,(metadados->>'longitude_exif')::float8);
  return jsonb_build_object('id',oid,'status','PENDENTE');
end; $$;
create or replace function public.moderar_registro(alvo uuid,decisao jsonb,moderador uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare obs public.observacoes; aid uuid;
begin
  if not exists(select 1 from auth.users where id=moderador and raw_app_meta_data->>'role'='admin') then raise exception 'Sem permissao'; end if;
  if decisao->>'status' not in ('APROVADO','REJEITADO') then raise exception 'Decisao invalida'; end if;
  select * into obs from public.observacoes where id=alvo for update;
  if obs.id is null or obs.status_moderacao<>'PENDENTE' then raise exception 'Registro indisponivel'; end if;
  aid:=obs.arvore_id;
  if coalesce((decisao->>'criar_nova')::boolean,false) then
    insert into public.arvores(localizacao,cor_principal,bairro) values(extensions.st_setsrid(extensions.st_makepoint(obs.longitude,obs.latitude),4326)::extensions.geography,obs.cor_observada,obs.bairro) returning id into aid;
  elsif decisao ? 'arvore_id' then
    select id into aid from public.arvores where id=(decisao->>'arvore_id')::uuid and (status='APROVADO' or (origem_municipal and status_validacao='CADASTRO_PUBLICO' and status<>'REJEITADO'));
    if aid is null then raise exception 'Arvore indisponivel'; end if;
  end if;
  if exists(select 1 from public.arvores a where a.id=aid and a.origem_municipal and not extensions.st_dwithin(a.localizacao,extensions.st_setsrid(extensions.st_makepoint(obs.longitude,obs.latitude),4326)::extensions.geography,10)) then raise exception 'Cadastro municipal distante: limite 10 m'; end if;
  if decisao->>'status'='APROVADO' and not exists(select 1 from public.fotos f where f.observacao_id=alvo) then raise exception 'Aprovacao exige fotografia'; end if;
  update public.observacoes set arvore_id=aid,status_moderacao=(decisao->>'status')::public.moderacao,
    cor_observada=(decisao->>'cor')::public.cor_flor,confianca_dados=(decisao->>'confianca')::public.confianca where id=alvo;
  if decisao->>'status'='APROVADO' then
    update public.arvores set status='APROVADO',cor_principal=(decisao->>'cor')::public.cor_flor,
      confianca=(decisao->>'confianca')::public.confianca,especie_id=(decisao->>'especie_id')::uuid,atualizado_em=now() where id=aid;
  end if;
  insert into privado.moderacoes(observacao_id,moderador_id,decisao) values(alvo,moderador,decisao);
  return jsonb_build_object('id',alvo,'status',decisao->>'status');
end; $$;
notify pgrst, 'reload schema';
commit;
