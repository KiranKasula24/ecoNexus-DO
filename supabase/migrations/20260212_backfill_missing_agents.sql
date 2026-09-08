-- Backfill one primary agent per company where missing.
insert into public.agents (company_id, name, agent_type, locality, status, constraints)
select
  c.id,
  'Agent-' || c.name,
  case
    when c.entity_type = 'recycler' then 'specialist_recycler'
    when c.entity_type = 'processor' then 'specialist_processor'
    when c.entity_type = 'energy_recovery' then 'specialist_processor'
    when c.entity_type = 'logistics' then 'specialist_logistics'
    else 'local'
  end as agent_type,
  coalesce(c.locality, lower(replace(c.name, ' ', '-'))),
  'active',
  '{}'::jsonb
from public.companies c
where not exists (
  select 1 from public.agents a where a.company_id = c.id
);
