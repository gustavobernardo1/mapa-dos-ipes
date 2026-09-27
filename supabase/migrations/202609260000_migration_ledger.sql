-- Private operational migration ledger, not exposed by the Data API.
begin;
create schema if not exists privado;
revoke all on schema privado from public,anon,authenticated;
create table if not exists privado.migrations_aplicadas (
  version text primary key, checksum text not null,
  applied_at timestamptz not null default now()
);
alter table privado.migrations_aplicadas enable row level security;
revoke all on privado.migrations_aplicadas from public,anon,authenticated;
commit;
