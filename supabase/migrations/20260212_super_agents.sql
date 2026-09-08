-- Super agents registry: one active super coordinator per locality.
create table if not exists public.super_agents (
  id uuid primary key default gen_random_uuid(),
  locality text not null unique,
  super_agent_id uuid not null unique references public.agents(id) on delete cascade,
  company_id uuid not null unique references public.companies(id) on delete cascade,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_super_agents_status on public.super_agents(status);

create or replace function public.sync_super_agents_from_agents()
returns trigger
language plpgsql
as $$
begin
  if (new.agent_type = 'super') then
    insert into public.super_agents(locality, super_agent_id, company_id, status, created_at, updated_at)
    values (new.locality, new.id, new.company_id, coalesce(new.status, 'active'), now(), now())
    on conflict (locality)
    do update set
      super_agent_id = excluded.super_agent_id,
      company_id = excluded.company_id,
      status = excluded.status,
      updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_super_agents_from_agents on public.agents;
create trigger trg_sync_super_agents_from_agents
after insert or update on public.agents
for each row
execute function public.sync_super_agents_from_agents();

-- Backfill registry from existing super agents.
insert into public.super_agents(locality, super_agent_id, company_id, status, created_at, updated_at)
select
  a.locality,
  a.id,
  a.company_id,
  coalesce(a.status, 'active'),
  now(),
  now()
from public.agents a
where a.agent_type = 'super'
on conflict (locality)
do update set
  super_agent_id = excluded.super_agent_id,
  company_id = excluded.company_id,
  status = excluded.status,
  updated_at = now();

-- Backfill one super company + agent per locality where missing.
do $$
declare
  loc text;
  c_id uuid;
begin
  for loc in
    select distinct locality
    from public.companies
    where locality is not null and trim(locality) <> ''
  loop
    if not exists (
      select 1
      from public.agents a
      where a.agent_type = 'super' and a.locality = loc
    ) then
      insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
      values (
        'NexaApex ' || loc,
        'coordination',
        'manufacturer',
        loc,
        jsonb_build_object('city', loc, 'country', 'unknown'),
        true
      )
      returning id into c_id;

      insert into public.agents(company_id, name, agent_type, locality, status, constraints)
      values (
        c_id,
        'NexaApex-' || loc,
        'super',
        loc,
        'active',
        '{"auto_generated": true}'::jsonb
      );
    end if;
  end loop;
end $$;
