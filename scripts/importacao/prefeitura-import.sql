-- Executado apenas dentro da transação protegida pelo plano aprovado.
-- Parâmetro único: snapshot JSON; nenhuma observação/foto é criada.
with input as (
 select * from jsonb_to_recordset($1::jsonb) as r(
   id uuid,codigo_publico text,fonte text,dataset text,layer text,layer_id int,objectid bigint,
   codigo_especie int,descricao text,nome_cientifico text,cor_cadastral text,
   geometria_original jsonb,atributos_brutos jsonb,latitude float8,longitude float8,
   hash_payload text,fonte_data_consulta timestamptz
 )
), new_trees as (
 insert into public.arvores(id,codigo_publico,localizacao,cor_principal,status,confianca,origem_municipal,status_validacao,
   descricao_municipal,cor_cadastral,proveniencia_municipal)
 select r.id,r.codigo_publico,extensions.st_setsrid(extensions.st_makepoint(r.longitude,r.latitude),4326)::extensions.geography,
   r.cor_cadastral::public.cor_flor,'PENDENTE','D',true,'CADASTRO_PUBLICO',r.descricao,r.cor_cadastral::public.cor_flor,
   jsonb_build_object('fonte',r.fonte,'dataset',r.dataset,'layer',r.layer,'layer_id',r.layer_id,'OBJECTID',r.objectid,
     'codigo_especie',r.codigo_especie,'descricao',r.descricao,'nome_cientifico',r.nome_cientifico,'data_consulta',r.fonte_data_consulta)
 from input r where not exists(select 1 from privado.cadastros_municipais c where (c.fonte,c.dataset,c.layer,c.objectid)=(r.fonte,r.dataset,r.layer,r.objectid))
 returning id
), saved as (
 insert into privado.cadastros_municipais(fonte,dataset,layer,layer_id,objectid,arvore_id,codigo_especie,descricao,nome_cientifico,
   geometria_original,geometria_arcgis_original,atributos_brutos,hash_payload,fonte_data_consulta)
 select r.fonte,r.dataset,r.layer,r.layer_id,r.objectid,coalesce(c.arvore_id,t.id),r.codigo_especie,r.descricao,r.nome_cientifico,
   extensions.st_setsrid(extensions.st_makepoint((r.geometria_original->>'x')::float8,(r.geometria_original->>'y')::float8),31982),
   r.geometria_original,r.atributos_brutos,r.hash_payload,r.fonte_data_consulta
 from input r left join privado.cadastros_municipais c on (c.fonte,c.dataset,c.layer,c.objectid)=(r.fonte,r.dataset,r.layer,r.objectid)
 left join new_trees t on t.id=r.id
 on conflict(fonte,dataset,layer,objectid) do update set codigo_especie=excluded.codigo_especie,descricao=excluded.descricao,
   nome_cientifico=excluded.nome_cientifico,geometria_original=excluded.geometria_original,
   geometria_arcgis_original=excluded.geometria_arcgis_original,atributos_brutos=excluded.atributos_brutos,
   hash_payload=excluded.hash_payload,fonte_data_consulta=excluded.fonte_data_consulta
 where privado.cadastros_municipais.hash_payload<>excluded.hash_payload
 returning *
), versions as (
 insert into privado.cadastros_municipais_versoes(fonte,dataset,layer,objectid,hash_payload,snapshot)
 select c.fonte,c.dataset,c.layer,c.objectid,c.hash_payload,to_jsonb(c) from saved c
 on conflict do nothing returning objectid
)
update public.arvores a set descricao_municipal=c.descricao,cor_cadastral=r.cor_cadastral::public.cor_flor,
  proveniencia_municipal=jsonb_build_object('fonte',c.fonte,'dataset',c.dataset,'layer',c.layer,'layer_id',c.layer_id,'OBJECTID',c.objectid,
    'codigo_especie',c.codigo_especie,'descricao',c.descricao,'nome_cientifico',c.nome_cientifico,'data_consulta',c.fonte_data_consulta),
  localizacao=case when a.status_verificacao_comunitaria='NAO_VERIFICADA' then extensions.st_setsrid(extensions.st_makepoint(r.longitude,r.latitude),4326)::extensions.geography else a.localizacao end,
  cor_principal=case when a.status_verificacao_comunitaria='NAO_VERIFICADA' then r.cor_cadastral::public.cor_flor else a.cor_principal end,
  atualizado_em=now()
from saved c join input r on r.objectid=c.objectid
where a.id=c.arvore_id;
