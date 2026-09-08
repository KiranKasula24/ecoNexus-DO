-- Hyderabad +10 scenario seed pack
-- Prerequisite: run your base Hyderabad seed first.
-- Safe to re-run.

do $$
declare
  v_seed_tag text := 'hyd-network-seed-v2-plus10';
  v_locality text := 'hyderabad';

  v_super_agent_id uuid;

  v_recycler_a_agent_id uuid;
  v_recycler_b_agent_id uuid;
  v_processor_a_agent_id uuid;
  v_processor_b_agent_id uuid;
  v_logistics_agent_id uuid;

  v_company_1_id uuid;
  v_company_2_id uuid;
  v_company_3_id uuid;
  v_company_4_id uuid;
  v_company_5_id uuid;

  v_company_1_agent_id uuid;
  v_company_2_agent_id uuid;
  v_company_3_agent_id uuid;
  v_company_4_agent_id uuid;
  v_company_5_agent_id uuid;
begin
  delete from public.agent_feed where content->>'seed_tag' = v_seed_tag;
  delete from public.deals where coalesce(agent_reasoning, '') ilike '%' || v_seed_tag || '%';

  select a.id into v_super_agent_id
  from public.agents a
  where a.locality = v_locality and a.agent_type = 'super'
  order by a.created_at desc
  limit 1;

  if v_super_agent_id is null then
    raise exception 'No super agent found for locality %; run base seed first', v_locality;
  end if;

  select a.id into v_recycler_a_agent_id
  from public.agents a
  where a.name = 'NexaPrime Recycler A - ' || v_locality
  order by a.created_at desc limit 1;

  select a.id into v_recycler_b_agent_id
  from public.agents a
  where a.name = 'NexaPrime Recycler B - ' || v_locality
  order by a.created_at desc limit 1;

  select a.id into v_processor_a_agent_id
  from public.agents a
  where a.name = 'NexaPrime Processor A - ' || v_locality
  order by a.created_at desc limit 1;

  select a.id into v_processor_b_agent_id
  from public.agents a
  where a.name = 'NexaPrime Processor B - ' || v_locality
  order by a.created_at desc limit 1;

  select a.id into v_logistics_agent_id
  from public.agents a
  where a.name = 'NexaPrime Logistics - ' || v_locality
  order by a.created_at desc limit 1;

  if v_recycler_a_agent_id is null or v_recycler_b_agent_id is null
     or v_processor_a_agent_id is null or v_processor_b_agent_id is null
     or v_logistics_agent_id is null then
    raise exception 'Missing one or more specialist agents in locality %', v_locality;
  end if;

  -- 5 additional demo companies for flow/create demos
  insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
  values
    ('Demo MetroCast Auto Components (' || v_locality || ')', 'manufacturing', 'manufacturer', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo InfraBeam Structures (' || v_locality || ')', 'manufacturing', 'manufacturer', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo RailGrid Fabrications (' || v_locality || ')', 'manufacturing', 'manufacturer', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo GreenKiln Minerals (' || v_locality || ')', 'materials', 'processor', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo HeatLoop Recovery (' || v_locality || ')', 'energy', 'energy_recovery', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true)
  on conflict do nothing;

  select id into v_company_1_id from public.companies where name = 'Demo MetroCast Auto Components (' || v_locality || ')';
  select id into v_company_2_id from public.companies where name = 'Demo InfraBeam Structures (' || v_locality || ')';
  select id into v_company_3_id from public.companies where name = 'Demo RailGrid Fabrications (' || v_locality || ')';
  select id into v_company_4_id from public.companies where name = 'Demo GreenKiln Minerals (' || v_locality || ')';
  select id into v_company_5_id from public.companies where name = 'Demo HeatLoop Recovery (' || v_locality || ')';

  insert into public.agents(company_id, name, agent_type, locality, status, constraints)
  values
    (v_company_1_id, 'Nexa-Demo MetroCast - ' || v_locality, 'local', v_locality, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_company_2_id, 'Nexa-Demo InfraBeam - ' || v_locality, 'local', v_locality, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_company_3_id, 'Nexa-Demo RailGrid - ' || v_locality, 'local', v_locality, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_company_4_id, 'Nexa-Demo GreenKiln - ' || v_locality, 'local', v_locality, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_company_5_id, 'Nexa-Demo HeatLoop - ' || v_locality, 'local', v_locality, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag))
  on conflict do nothing;

  select id into v_company_1_agent_id from public.agents where company_id = v_company_1_id and agent_type = 'local' order by created_at desc limit 1;
  select id into v_company_2_agent_id from public.agents where company_id = v_company_2_id and agent_type = 'local' order by created_at desc limit 1;
  select id into v_company_3_agent_id from public.agents where company_id = v_company_3_id and agent_type = 'local' order by created_at desc limit 1;
  select id into v_company_4_agent_id from public.agents where company_id = v_company_4_id and agent_type = 'local' order by created_at desc limit 1;
  select id into v_company_5_agent_id from public.agents where company_id = v_company_5_id and agent_type = 'local' order by created_at desc limit 1;

  -- 10 additional scenario offers aligned to local demand
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_recycler_a_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s1','material_category','ferrous-metals','material_subtype','steel-turnings-clean','material','steel turnings clean','volume',70,'unit','tons','price',208,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_recycler_b_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s2','material_category','ferrous-metals','material_subtype','hms-1-heavy-scrap','material','hms1 heavy scrap','volume',95,'unit','tons','price',214,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_processor_a_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s3','material_category','ferrous-metals','material_subtype','re-rolled-billet-feed','material','re-rolled billet feed','volume',60,'unit','tons','price',238,'quality_tier',1,'seed_tag',v_seed_tag)),
    (v_processor_b_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s4','material_category','ferrous-metals','material_subtype','de-zinced-galv-scrap','material','de-zinced galvanized scrap','volume',55,'unit','tons','price',232,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_recycler_a_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s5','material_category','ferrous-metals','material_subtype','cast-iron-returns','material','cast iron returns','volume',80,'unit','tons','price',220,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_recycler_b_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s6','material_category','ferrous-metals','material_subtype','stainless-scrap-304-mix','material','stainless scrap 304 mix','volume',48,'unit','tons','price',265,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_processor_a_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s7','material_category','ferrous-metals','material_subtype','mill-scale-blend','material','mill scale blend','volume',75,'unit','tons','price',198,'quality_tier',3,'seed_tag',v_seed_tag)),
    (v_processor_b_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s8','material_category','ferrous-metals','material_subtype','iron-oxide-fines','material','iron oxide fines','volume',68,'unit','tons','price',190,'quality_tier',3,'seed_tag',v_seed_tag)),
    (v_recycler_a_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s9','material_category','ferrous-metals','material_subtype','briquetted-turnings','material','briquetted turnings','volume',72,'unit','tons','price',226,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_logistics_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('scenario_key','s10','material_category','ferrous-metals','material_subtype','cluster-transport-bundle','material','cluster transport bundle','volume',200,'unit','tons','price',18,'quality_tier',2,'service_type','logistics','seed_tag',v_seed_tag));

  -- matching demand from 5 local-company agents
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_company_1_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s1','material_category','ferrous-metals','material_subtype','steel-turnings-clean','volume_needed',50,'max_price',220,'quality_tier_max',2,'target_specialist_type','specialist_processor','seed_tag',v_seed_tag)),
    (v_company_2_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s2','material_category','ferrous-metals','material_subtype','hms-1-heavy-scrap','volume_needed',80,'max_price',228,'quality_tier_max',2,'target_specialist_type','specialist_recycler','seed_tag',v_seed_tag)),
    (v_company_3_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s3','material_category','ferrous-metals','material_subtype','re-rolled-billet-feed','volume_needed',45,'max_price',250,'quality_tier_max',1,'target_specialist_type','specialist_processor','seed_tag',v_seed_tag)),
    (v_company_4_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s4','material_category','ferrous-metals','material_subtype','de-zinced-galv-scrap','volume_needed',40,'max_price',245,'quality_tier_max',2,'target_specialist_type','specialist_processor','seed_tag',v_seed_tag)),
    (v_company_5_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s5','material_category','ferrous-metals','material_subtype','cast-iron-returns','volume_needed',65,'max_price',232,'quality_tier_max',2,'target_specialist_type','specialist_recycler','seed_tag',v_seed_tag)),
    (v_company_1_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s6','material_category','ferrous-metals','material_subtype','stainless-scrap-304-mix','volume_needed',35,'max_price',280,'quality_tier_max',2,'target_specialist_type','specialist_recycler','seed_tag',v_seed_tag)),
    (v_company_2_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s7','material_category','ferrous-metals','material_subtype','mill-scale-blend','volume_needed',55,'max_price',210,'quality_tier_max',3,'target_specialist_type','specialist_processor','seed_tag',v_seed_tag)),
    (v_company_3_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s8','material_category','ferrous-metals','material_subtype','iron-oxide-fines','volume_needed',50,'max_price',205,'quality_tier_max',3,'target_specialist_type','specialist_processor','seed_tag',v_seed_tag)),
    (v_company_4_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s9','material_category','ferrous-metals','material_subtype','briquetted-turnings','volume_needed',60,'max_price',238,'quality_tier_max',2,'target_specialist_type','specialist_recycler','seed_tag',v_seed_tag)),
    (v_company_5_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('scenario_key','s10','material_category','ferrous-metals','material_subtype','cluster-transport-bundle','volume_needed',160,'max_price',25,'quality_tier_max',2,'target_specialist_type','specialist_logistics','seed_tag',v_seed_tag));

  -- Super-agent same-locality deal proposals for each scenario
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s1','summary','Many-to-one local bundle: turnings from recycler into MetroCast and InfraBeam demand lane','relation_type','many_to_one','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s2','summary','One-to-many local split: HMS stream allocated across two fabrication buyers','relation_type','one_to_many','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s3','summary','Many-to-one local bundle: billet feed pooled to meet rail-grid demand','relation_type','many_to_one','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s4','summary','One-to-many local split: de-zinced scrap into components plus minerals','relation_type','one_to_many','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s5','summary','Many-to-one local bundle: cast-iron returns aggregated for HeatLoop + MetroCast','relation_type','many_to_one','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s6','summary','One-to-many local split: stainless mix routed to high-grade and medium-grade lines','relation_type','one_to_many','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s7','summary','Many-to-one local bundle: mill scale consolidation with processor scheduling','relation_type','many_to_one','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s8','summary','One-to-many local split: iron oxide fines into two downstream flows','relation_type','one_to_many','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s9','summary','Many-to-one local bundle: briquetted turnings merged with local buyer queue','relation_type','many_to_one','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('scenario_key','s10','summary','One-to-many local split: logistics bundle supports multi-buyer dispatch','relation_type','one_to_many','seed_tag',v_seed_tag));

  -- One summary assist post
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_super_agent_id, 'announcement', v_locality, 'local', true, jsonb_build_object(
      'type','local_agent_assist',
      'title','Locality Assist Digest',
      'description','Top 10 same-locality ferrous scenarios seeded and mapped to matching buyer requests.',
      'seed_tag',v_seed_tag
    ));

  raise notice 'Hyderabad +10 scenarios seeded successfully. seed_tag=%', v_seed_tag;
end $$;

