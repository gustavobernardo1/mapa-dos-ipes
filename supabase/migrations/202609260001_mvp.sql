-- Apply in Supabase SQL editor or `supabase db push`. No demonstration trees.
begin;
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
create type public.cor_flor as enum ('AMARELO','ROSA_ROXO','BRANCO','NAO_SEI','OUTRO');
create type public.moderacao as enum ('PENDENTE','APROVADO','REJEITADO');
create type public.confianca as enum ('A','B','C','D');
create table public.especies (
  id uuid primary key default gen_random_uuid(), nome_popular text not null,
  nome_cientifico text, genero text, cor_floracao public.cor_flor,
  ativo boolean not null default true, criado_em timestamptz not null default now()
);
create table public.campanhas (
  id uuid primary key default gen_random_uuid(), slug text unique not null,
  nome text not null, descricao text, data_inicio date, data_fim date,
  ativo boolean not null default true
);
insert into public.campanhas(slug,nome,descricao,data_inicio,data_fim)
values ('IPES_GOIANIA_2026','Florada dos ipês de Goiânia — 2026','Registros comunitários da campanha inicial.','2026-01-01','2026-12-31');
-- Catalog labels are provisional groupings, not species determinations.
insert into public.especies(nome_popular,genero,cor_floracao) values
('Ipê-amarelo (grupo, identificação pendente)','Handroanthus','AMARELO'),
('Ipê-rosa/roxo (grupo, identificação pendente)','Handroanthus','ROSA_ROXO'),
('Ipê-branco (identificação pendente)','Tabebuia','BRANCO');
create sequence public.codigo_arvore;
create table public.arvores (
  id uuid primary key default gen_random_uuid(),
  codigo_publico text unique not null default ('GYN-' || lpad(nextval('public.codigo_arvore')::text,5,'0')),
  especie_id uuid references public.especies(id),
  localizacao extensions.geography(Point,4326) not null,
  cor_principal public.cor_flor not null default 'NAO_SEI', bairro text not null default '',
  status public.moderacao not null default 'PENDENTE', confianca public.confianca not null default 'D',
  criado_em timestamptz not null default now(), atualizado_em timestamptz not null default now()
);
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_publico text check(length(nome_publico)<=80), criado_em timestamptz not null default now()
);
create table public.observacoes (
  id uuid primary key default gen_random_uuid(), arvore_id uuid not null references public.arvores(id),
  campanha_id uuid references public.campanhas(id), data_observacao date not null check(data_observacao<=current_date),
  origem text not null check(origem in ('CAMPO_ATUAL','FOTO_HISTORICA')),
  status_floracao text not null check(status_floracao in ('INTENSA','ALGUMAS','CAINDO','SEM_FLORES','NAO_SEI')),
  cor_observada public.cor_flor not null, identificacao_usuario text not null check(identificacao_usuario in ('CERTEZA','PROVAVEL','NAO_SEI')),
  comentario text not null default '' check(length(comentario)<=1500),
  nome_publico text not null default '' check(length(nome_publico)<=80), bairro text not null default '' check(length(bairro)<=100),
  latitude double precision not null check(latitude between -90 and 90),
  longitude double precision not null check(longitude between -180 and 180),
  confianca_dados public.confianca not null default 'D', status_moderacao public.moderacao not null default 'PENDENTE',
  colaborador_id uuid references public.perfis(id), criado_em timestamptz not null default now()
);
create table public.fotos (
  id uuid primary key default gen_random_uuid(), observacao_id uuid not null references public.observacoes(id),
  url text not null, key text unique not null, thumbnail_key text unique not null,
  hash_arquivo text unique not null, largura integer not null check(largura>0 and largura<=1800),
  altura integer not null check(altura>0 and altura<=1800), criado_em timestamptz not null default now()
);
-- EXIF is not public. Only relevant metadata is retained; normalized photos strip all EXIF.
create table privado.fotos_metadata (
  foto_id uuid primary key references public.fotos(id) on delete cascade,
  data_exif timestamptz, latitude_exif double precision, longitude_exif double precision
);
create table public.classificacoes (
  id uuid primary key default gen_random_uuid(), observacao_id uuid not null references public.observacoes(id),
  arvore_id uuid references public.arvores(id), tipo_modelo text not null,
  versao_modelo text not null, classe text not null, probabilidade double precision check(probabilidade between 0 and 1),
  criado_em timestamptz not null default now()
);
create table privado.moderacoes (
  id uuid primary key default gen_random_uuid(), observacao_id uuid not null references public.observacoes(id),
  moderador_id uuid not null references auth.users(id), decisao jsonb not null, criado_em timestamptz not null default now()
);
create table privado.limites (chave text primary key, quantidade integer not null, expira_em timestamptz not null);
create index arvores_geo_gist on public.arvores using gist(localizacao);
create index arvores_status_cor on public.arvores(status,cor_principal);
create index arvores_especie on public.arvores(especie_id);
create index observacoes_arvore_data on public.observacoes(arvore_id,data_observacao desc,criado_em desc);
create index observacoes_status_data on public.observacoes(status_moderacao,data_observacao desc);
create index observacoes_campanha on public.observacoes(campanha_id);
create index fotos_observacao on public.fotos(observacao_id);
create index classificacoes_observacao on public.classificacoes(observacao_id);
create index limites_expiracao on privado.limites(expira_em);

create function public.e_admin() returns boolean language sql stable set search_path='' as $$
  select coalesce(auth.jwt()->'app_metadata'->>'role','')='admin';
$$;
alter table public.especies enable row level security;
alter table public.campanhas enable row level security;
alter table public.arvores enable row level security;
alter table public.observacoes enable row level security;
alter table public.fotos enable row level security;
alter table public.perfis enable row level security;
alter table public.classificacoes enable row level security;
alter table privado.fotos_metadata enable row level security;
alter table privado.moderacoes enable row level security;
alter table privado.limites enable row level security;
create policy especies_publicas on public.especies for select to anon,authenticated using(ativo);
create policy campanhas_publicas on public.campanhas for select to anon,authenticated using(ativo);
create policy arvores_aprovadas on public.arvores for select to anon,authenticated using(status='APROVADO');
create policy observacoes_aprovadas on public.observacoes for select to anon,authenticated using(
  status_moderacao='APROVADO' and exists(select 1 from public.arvores a where a.id=arvore_id and a.status='APROVADO')
);
create policy fotos_aprovadas on public.fotos for select to anon,authenticated using(
  exists(select 1 from public.observacoes o where o.id=observacao_id and o.status_moderacao='APROVADO')
);
create policy perfil_proprio on public.perfis for select to authenticated using(id=auth.uid());
-- No public writes. Submission passes a validated, throttled server API, then a service-only RPC.
revoke all on public.especies,public.campanhas,public.arvores,public.observacoes,public.fotos,public.perfis,public.classificacoes from anon,authenticated;
grant select on public.especies,public.campanhas,public.arvores,public.observacoes,public.fotos,public.perfis to anon,authenticated;
grant usage on schema privado to service_role;
grant all on all tables in schema privado to service_role;

create function public.observacao_json(alvo uuid, incluir_privado boolean default false) returns jsonb
language sql stable security invoker set search_path='' as $$
  select (to_jsonb(o)-'colaborador_id') || jsonb_build_object('fotos',coalesce((select jsonb_agg(to_jsonb(f)) from public.fotos f where f.observacao_id=o.id),'[]'::jsonb)) ||
    case when incluir_privado and auth.role()='service_role' then jsonb_build_object('metadata',coalesce((select jsonb_agg(to_jsonb(m)) from privado.fotos_metadata m join public.fotos f on f.id=m.foto_id where f.observacao_id=o.id),'[]'::jsonb)) else '{}'::jsonb end
  from public.observacoes o where o.id=alvo;
$$;
-- Split private and public helpers so public queries never need privileges on private tables.
create function public.observacao_publica(alvo uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
  select (to_jsonb(o)-'colaborador_id') || jsonb_build_object('fotos',coalesce((select jsonb_agg(to_jsonb(f)) from public.fotos f where f.observacao_id=o.id),'[]'::jsonb))
  from public.observacoes o where o.id=alvo;
$$;
create function public.arvore_json(alvo uuid) returns jsonb language sql stable security invoker set search_path='' as $$
  select (to_jsonb(a)-'localizacao') || jsonb_build_object(
    'latitude',extensions.st_y(a.localizacao::extensions.geometry),'longitude',extensions.st_x(a.localizacao::extensions.geometry),
    'nome_popular',coalesce(e.nome_popular,'Ipê provável'),
    'observacoes',coalesce((select jsonb_agg(public.observacao_publica(o.id) order by o.data_observacao desc,o.criado_em desc) from public.observacoes o where o.arvore_id=a.id),'[]'::jsonb))
  from public.arvores a left join public.especies e on e.id=a.especie_id where a.id=alvo;
$$;
create function public.arvore_ficha(alvo uuid) returns jsonb language sql stable security invoker set search_path='' as $$
  select public.arvore_json(a.id) from public.arvores a where a.id=alvo and a.status='APROVADO' and exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO');
$$;
create function public.especies_publicas() returns jsonb language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'nome_popular',nome_popular,'nome_cientifico',nome_cientifico) order by nome_popular),'[]'::jsonb) from public.especies where ativo;
$$;
create function public.arvores_consulta(filtros jsonb default '{}') returns jsonb
language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(resultado),'[]'::jsonb) from (
    select public.arvore_json(a.id) || case when filtros ? 'lat' then jsonb_build_object('distancia',extensions.st_distance(a.localizacao,extensions.st_setsrid(extensions.st_makepoint((filtros->>'lng')::float8,(filtros->>'lat')::float8),4326)::extensions.geography)) else '{}'::jsonb end as resultado
    from public.arvores a left join public.especies e on a.especie_id=e.id
    where a.status='APROVADO' and exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO')
      and (not filtros ? 'west' or extensions.st_intersects(a.localizacao::extensions.geometry,extensions.st_makeenvelope((filtros->>'west')::float8,(filtros->>'south')::float8,(filtros->>'east')::float8,(filtros->>'north')::float8,4326)))
      and (not filtros ? 'lat' or extensions.st_dwithin(a.localizacao,extensions.st_setsrid(extensions.st_makepoint((filtros->>'lng')::float8,(filtros->>'lat')::float8),4326)::extensions.geography,least(coalesce((filtros->>'radius')::float8,10),5000)))
      and (not filtros ? 'color' or a.cor_principal::text=filtros->>'color')
      and (not filtros ? 'species' or a.especie_id=(filtros->>'species')::uuid)
      and (not filtros ? 'confidence' or a.confianca::text=filtros->>'confidence')
      and (not filtros ? 'since' or exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO' and o.data_observacao>=(filtros->>'since')::date))
      and (coalesce(filtros->>'search','')='' or a.bairro ilike '%'||(filtros->>'search')||'%' or a.codigo_publico ilike '%'||(filtros->>'search')||'%' or e.nome_popular ilike '%'||(filtros->>'search')||'%')
      and (not coalesce((filtros->>'blooming')::boolean,false) or (
        select o.status_floracao in ('INTENSA','ALGUMAS','CAINDO') and o.data_observacao>=current_date-7 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO' order by o.data_observacao desc,o.criado_em desc limit 1))
    order by case when filtros->>'sort'='observations' then (select count(*) from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO') end desc,
      case when filtros ? 'lat' then extensions.st_distance(a.localizacao,extensions.st_setsrid(extensions.st_makepoint((filtros->>'lng')::float8,(filtros->>'lat')::float8),4326)::extensions.geography) end,
      a.atualizado_em desc
    limit greatest(1,least(coalesce((filtros->>'limit')::int,100),500)) offset greatest(coalesce((filtros->>'offset')::int,0),0)
  ) dados;
$$;
-- ST_DWithin uses the geography GiST index. A geometry index also supports viewport queries.
create index arvores_viewport_gist on public.arvores using gist((localizacao::extensions.geometry));
create function public.estatisticas() returns jsonb language sql stable security invoker set search_path='' as $$
  select jsonb_build_object(
    'arvores',count(*),'amarelas',count(*) filter(where cor_principal='AMARELO'),
    'rosas_roxas',count(*) filter(where cor_principal='ROSA_ROXO'),'brancas',count(*) filter(where cor_principal='BRANCO'),
    'floridas',count(*) filter(where (select o.status_floracao in ('INTENSA','ALGUMAS','CAINDO') and o.data_observacao>=current_date-7 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO' order by o.data_observacao desc,o.criado_em desc limit 1)),
    'observacoes',(select count(*) from public.observacoes where status_moderacao='APROVADO'),
    'fotos',(select count(*) from public.fotos f join public.observacoes o on o.id=f.observacao_id where o.status_moderacao='APROVADO')
  ) from public.arvores a where a.status='APROVADO' and exists(select 1 from public.observacoes o where o.arvore_id=a.id and o.status_moderacao='APROVADO');
$$;
create function public.galeria_consulta(filtros jsonb default '{}') returns jsonb language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(resultado),'[]'::jsonb) from (
    select to_jsonb(f)||jsonb_build_object('observacao',public.observacao_publica(o.id),'arvore',public.arvore_json(a.id)-'observacoes') resultado
    from public.fotos f join public.observacoes o on o.id=f.observacao_id join public.arvores a on a.id=o.arvore_id
    where o.status_moderacao='APROVADO' and a.status='APROVADO'
      and (not filtros ? 'color' or o.cor_observada::text=filtros->>'color')
      and (coalesce(filtros->>'search','')='' or a.bairro ilike '%'||(filtros->>'search')||'%')
      and (not coalesce((filtros->>'historical')::boolean,false) or o.origem='FOTO_HISTORICA')
      and (not coalesce((filtros->>'week')::boolean,false) or o.data_observacao>=current_date-7)
    order by o.data_observacao desc,f.criado_em desc
    limit greatest(1,least(coalesce((filtros->>'limit')::int,24),100)) offset greatest(coalesce((filtros->>'offset')::int,0),0)
  ) dados;
$$;

-- Service-only transactions. No client can invoke them, even an authenticated user.
create function public.enviar_registro(dados jsonb,foto jsonb,metadados jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare aid uuid; oid uuid:=(foto->>'observacao_id')::uuid; fid uuid:=(foto->>'id')::uuid; point extensions.geography;
begin
  point:=extensions.st_setsrid(extensions.st_makepoint((dados->>'longitude')::float8,(dados->>'latitude')::float8),4326)::extensions.geography;
  if dados ? 'arvore_id' then
    select id into aid from public.arvores where id=(dados->>'arvore_id')::uuid and status='APROVADO' and extensions.st_dwithin(localizacao,point,100) for share;
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
create function public.moderacao_pendentes() returns jsonb language sql stable security definer set search_path='' as $$
  select coalesce(jsonb_agg(resultado),'[]'::jsonb) from (
    select public.observacao_json(o.id,true)||jsonb_build_object('arvore',public.arvore_json(o.arvore_id)) resultado from public.observacoes o
    where o.status_moderacao='PENDENTE' order by o.criado_em limit 50
  ) dados;
$$;
create function public.moderar_registro(alvo uuid,decisao jsonb,moderador uuid) returns jsonb
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
    select id into aid from public.arvores where id=(decisao->>'arvore_id')::uuid and status='APROVADO';
    if aid is null then raise exception 'Arvore indisponivel'; end if;
  end if;
  update public.observacoes set arvore_id=aid,status_moderacao=(decisao->>'status')::public.moderacao,
    cor_observada=(decisao->>'cor')::public.cor_flor,confianca_dados=(decisao->>'confianca')::public.confianca where id=alvo;
  if decisao->>'status'='APROVADO' then
    update public.arvores set status='APROVADO',cor_principal=(decisao->>'cor')::public.cor_flor,
      confianca=(decisao->>'confianca')::public.confianca,especie_id=(decisao->>'especie_id')::uuid,atualizado_em=now() where id=aid;
  end if;
  insert into privado.moderacoes(observacao_id,moderador_id,decisao) values(alvo,moderador,decisao);
  return jsonb_build_object('id',alvo,'status',decisao->>'status');
end; $$;
create function public.foto_autorizada(chave text,administrador boolean) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.fotos f join public.observacoes o on o.id=f.observacao_id join public.arvores a on a.id=o.arvore_id where (f.key=chave or f.thumbnail_key=chave) and (administrador or (o.status_moderacao='APROVADO' and a.status='APROVADO')));
$$;
create function public.limitar_envios(chave text,maximo integer) returns boolean language plpgsql security definer set search_path='' as $$
declare qtd integer;
begin
  delete from privado.limites where expira_em<now();
  insert into privado.limites values(chave,1,now()+interval '1 hour')
  on conflict on constraint limites_pkey do update set quantidade=privado.limites.quantidade+1 returning quantidade into qtd;
  return qtd<=maximo;
end; $$;
-- Default PUBLIC EXECUTE is revoked individually; unrelated Supabase functions are untouched.
revoke all on function public.observacao_json(uuid,boolean),public.enviar_registro(jsonb,jsonb,jsonb),public.moderacao_pendentes(),public.moderar_registro(uuid,jsonb,uuid),public.foto_autorizada(text,boolean),public.limitar_envios(text,integer) from public,anon,authenticated;
grant execute on function public.observacao_json(uuid,boolean),public.enviar_registro(jsonb,jsonb,jsonb),public.moderacao_pendentes(),public.moderar_registro(uuid,jsonb,uuid),public.foto_autorizada(text,boolean),public.limitar_envios(text,integer) to service_role;
revoke all on function public.e_admin(),public.observacao_publica(uuid),public.arvore_json(uuid),public.arvore_ficha(uuid),public.especies_publicas(),public.arvores_consulta(jsonb),public.estatisticas(),public.galeria_consulta(jsonb) from public;
grant execute on function public.e_admin(),public.observacao_publica(uuid),public.arvore_json(uuid),public.arvore_ficha(uuid),public.especies_publicas(),public.arvores_consulta(jsonb),public.estatisticas(),public.galeria_consulta(jsonb) to anon,authenticated,service_role;
commit;
