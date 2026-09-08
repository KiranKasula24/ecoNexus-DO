-- Super-agent company pack: 10 companies + multi-locality deal signals
-- Purpose:
-- 1) Seed 10 physical companies across Hyderabad/Bengaluru/Chennai
-- 2) Seed offers/requests so NexaApex generates same-locality + cross-locality multi-party deals
-- 3) Keep data re-runnable via seed_tag cleanup
--
-- Run order:
-- 1) Run this file in Supabase SQL Editor
-- 2) Trigger one agent cycle: POST /api/agents/run-cycle

do $$
declare
  v_seed_tag text := 'super-company-pack-10-v1';
  v_hyd text := 'hyderabad';
  v_blr text := 'bengaluru';
  v_che text := 'chennai';

  -- 10 demo companies
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid;
  c6 uuid; c7 uuid; c8 uuid; c9 uuid; c10 uuid;

  -- super wrapper companies
  c_super_hyd uuid; c_super_blr uuid; c_super_che uuid;

  -- agents
  a1 uuid; a2 uuid; a3 uuid; a4 uuid; a5 uuid;
  a6 uuid; a7 uuid; a8 uuid; a9 uuid; a10 uuid;
  a_super_hyd uuid; a_super_blr uuid; a_super_che uuid;
begin
  -- Cleanup previous seed rows
  delete from public.agent_feed where content->>'seed_tag' = v_seed_tag;
  delete from public.deals where coalesce(agent_reasoning, '') ilike '%' || v_seed_tag || '%';
  delete from public.waste_streams
  where material_id in (
    select m.id from public.materials m where m.technical_properties->>'seed_tag' = v_seed_tag
  );
  delete from public.materials where technical_properties->>'seed_tag' = v_seed_tag;

  -- Create 10 companies
  insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
  values
    ('Demo Hyd Recycler Alpha', 'recycling', 'recycler', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Hyd Processor Beta', 'processing', 'processor', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Hyd Buyer Gamma', 'manufacturing', 'manufacturer', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Hyd Buyer Delta', 'manufacturing', 'manufacturer', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Hyd Logistics Epsilon', 'logistics', 'logistics', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Blr Recycler Zeta', 'recycling', 'recycler', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true),
    ('Demo Blr Processor Eta', 'processing', 'processor', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true),
    ('Demo Blr Buyer Theta', 'manufacturing', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true),
    ('Demo Blr Buyer Iota', 'manufacturing', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true),
    ('Demo Chennai Logistics Kappa', 'logistics', 'logistics', v_che, jsonb_build_object('city', v_che, 'country', 'IN'), true)
  on conflict do nothing;

  select id into c1 from public.companies where name = 'Demo Hyd Recycler Alpha';
  select id into c2 from public.companies where name = 'Demo Hyd Processor Beta';
  select id into c3 from public.companies where name = 'Demo Hyd Buyer Gamma';
  select id into c4 from public.companies where name = 'Demo Hyd Buyer Delta';
  select id into c5 from public.companies where name = 'Demo Hyd Logistics Epsilon';
  select id into c6 from public.companies where name = 'Demo Blr Recycler Zeta';
  select id into c7 from public.companies where name = 'Demo Blr Processor Eta';
  select id into c8 from public.companies where name = 'Demo Blr Buyer Theta';
  select id into c9 from public.companies where name = 'Demo Blr Buyer Iota';
  select id into c10 from public.companies where name = 'Demo Chennai Logistics Kappa';

  -- Super wrapper companies
  insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
  values
    ('NexaApex ' || v_hyd, 'coordination', 'manufacturer', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('NexaApex ' || v_blr, 'coordination', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true),
    ('NexaApex ' || v_che, 'coordination', 'manufacturer', v_che, jsonb_build_object('city', v_che, 'country', 'IN'), true)
  on conflict do nothing;

  select id into c_super_hyd from public.companies where name = 'NexaApex ' || v_hyd;
  select id into c_super_blr from public.companies where name = 'NexaApex ' || v_blr;
  select id into c_super_che from public.companies where name = 'NexaApex ' || v_che;

  -- Agents for 10 companies
  insert into public.agents(company_id, name, agent_type, locality, status, constraints)
  values
    (c1, 'NexaPrime Hyd Recycler Alpha', 'specialist_recycler', v_hyd, 'active', jsonb_build_object('accepted_material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c2, 'NexaPrime Hyd Processor Beta', 'specialist_processor', v_hyd, 'active', jsonb_build_object('input_materials', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c3, 'Nexa Hyd Buyer Gamma', 'local', v_hyd, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c4, 'Nexa Hyd Buyer Delta', 'local', v_hyd, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c5, 'NexaPrime Hyd Logistics Epsilon', 'specialist_logistics', v_hyd, 'active', jsonb_build_object('service_regions', jsonb_build_array(v_hyd, v_blr), 'seed_tag', v_seed_tag)),
    (c6, 'NexaPrime Blr Recycler Zeta', 'specialist_recycler', v_blr, 'active', jsonb_build_object('accepted_material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c7, 'NexaPrime Blr Processor Eta', 'specialist_processor', v_blr, 'active', jsonb_build_object('input_materials', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c8, 'Nexa Blr Buyer Theta', 'local', v_blr, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c9, 'Nexa Blr Buyer Iota', 'local', v_blr, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (c10, 'NexaPrime Chennai Logistics Kappa', 'specialist_logistics', v_che, 'active', jsonb_build_object('service_regions', jsonb_build_array(v_hyd, v_blr, v_che), 'seed_tag', v_seed_tag))
  on conflict do nothing;

  select id into a1 from public.agents where company_id = c1 and agent_type = 'specialist_recycler' order by created_at desc limit 1;
  select id into a2 from public.agents where company_id = c2 and agent_type = 'specialist_processor' order by created_at desc limit 1;
  select id into a3 from public.agents where company_id = c3 and agent_type = 'local' order by created_at desc limit 1;
  select id into a4 from public.agents where company_id = c4 and agent_type = 'local' order by created_at desc limit 1;
  select id into a5 from public.agents where company_id = c5 and agent_type = 'specialist_logistics' order by created_at desc limit 1;
  select id into a6 from public.agents where company_id = c6 and agent_type = 'specialist_recycler' order by created_at desc limit 1;
  select id into a7 from public.agents where company_id = c7 and agent_type = 'specialist_processor' order by created_at desc limit 1;
  select id into a8 from public.agents where company_id = c8 and agent_type = 'local' order by created_at desc limit 1;
  select id into a9 from public.agents where company_id = c9 and agent_type = 'local' order by created_at desc limit 1;
  select id into a10 from public.agents where company_id = c10 and agent_type = 'specialist_logistics' order by created_at desc limit 1;

  -- Super agents
  insert into public.agents(company_id, name, agent_type, locality, status, constraints)
  values
    (c_super_hyd, 'NexaApex-' || v_hyd, 'super', v_hyd, 'active', jsonb_build_object('coordination_scope','locality','cross_locality_enabled',true,'seed_tag',v_seed_tag)),
    (c_super_blr, 'NexaApex-' || v_blr, 'super', v_blr, 'active', jsonb_build_object('coordination_scope','locality','cross_locality_enabled',true,'seed_tag',v_seed_tag)),
    (c_super_che, 'NexaApex-' || v_che, 'super', v_che, 'active', jsonb_build_object('coordination_scope','locality','cross_locality_enabled',true,'seed_tag',v_seed_tag))
  on conflict do nothing;

  select id into a_super_hyd from public.agents where company_id = c_super_hyd and agent_type = 'super' order by created_at desc limit 1;
  select id into a_super_blr from public.agents where company_id = c_super_blr and agent_type = 'super' order by created_at desc limit 1;
  select id into a_super_che from public.agents where company_id = c_super_che and agent_type = 'super' order by created_at desc limit 1;

  -- Minimal MFA-like rows for super-agent flow analysis
  insert into public.materials(company_id, material_type, category, material_category, material_subtype, physical_form, monthly_volume, unit, cost_per_unit, technical_properties)
  values
    (c1, 'Hydra ferrous input', 'input', 'ferrous-metals', 'mixed-steel-offcuts', 'solid', 140, 'tons', 210, jsonb_build_object('seed_tag', v_seed_tag)),
    (c2, 'Hydra process feed', 'input', 'ferrous-metals', 'shredded-ferrous-scrap', 'solid', 170, 'tons', 225, jsonb_build_object('seed_tag', v_seed_tag)),
    (c3, 'Gamma input feed', 'input', 'ferrous-metals', 'processed-ferrous-blend', 'solid', 110, 'tons', 245, jsonb_build_object('seed_tag', v_seed_tag)),
    (c4, 'Delta input feed', 'input', 'ferrous-metals', 'processed-ferrous-blend', 'solid', 90, 'tons', 242, jsonb_build_object('seed_tag', v_seed_tag)),
    (c6, 'Blr recycler intake', 'input', 'ferrous-metals', 'mixed-steel-offcuts', 'solid', 130, 'tons', 214, jsonb_build_object('seed_tag', v_seed_tag)),
    (c7, 'Blr process feed', 'input', 'ferrous-metals', 'shredded-ferrous-scrap', 'solid', 150, 'tons', 229, jsonb_build_object('seed_tag', v_seed_tag)),
    (c8, 'Theta buyer input', 'input', 'ferrous-metals', 'processed-ferrous-blend', 'solid', 95, 'tons', 252, jsonb_build_object('seed_tag', v_seed_tag)),
    (c9, 'Iota buyer input', 'input', 'ferrous-metals', 'processed-ferrous-blend', 'solid', 88, 'tons', 249, jsonb_build_object('seed_tag', v_seed_tag));

  -- Waste rows + streams
  insert into public.materials(company_id, material_type, category, material_category, material_subtype, physical_form, monthly_volume, unit, cost_per_unit, technical_properties)
  values
    (c1, 'Alpha ferrous waste', 'waste', 'ferrous-metals', 'shredded-ferrous-scrap', 'scrap', 120, 'tons', 58, jsonb_build_object('seed_tag', v_seed_tag)),
    (c2, 'Beta ferrous waste', 'waste', 'ferrous-metals', 'processed-ferrous-blend', 'scrap', 100, 'tons', 62, jsonb_build_object('seed_tag', v_seed_tag)),
    (c6, 'Zeta ferrous waste', 'waste', 'ferrous-metals', 'mixed-steel-offcuts', 'scrap', 105, 'tons', 56, jsonb_build_object('seed_tag', v_seed_tag)),
    (c7, 'Eta ferrous waste', 'waste', 'ferrous-metals', 'processed-ferrous-blend', 'scrap', 92, 'tons', 61, jsonb_build_object('seed_tag', v_seed_tag));

  insert into public.waste_streams(company_id, material_id, classification, monthly_volume, current_disposal_cost, contamination_level, quality_grade, potential_value, processability_score, recyclable_score)
  select m.company_id, m.id, 'ferrous-metals', m.monthly_volume, m.cost_per_unit, 12, 'B', 210, 78, 84
  from public.materials m
  where m.category = 'waste'
    and m.technical_properties->>'seed_tag' = v_seed_tag;

  -- Feed: offers (supply)
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (a1, 'offer', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','material','shredded ferrous scrap','volume',120,'unit','tons','price',212,'quality_tier',2,'seed_tag',v_seed_tag)),
    (a2, 'offer', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','processed-ferrous-blend','material','processed ferrous blend','volume',100,'unit','tons','price',228,'quality_tier',1,'seed_tag',v_seed_tag)),
    (a6, 'offer', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','material','mixed steel offcuts','volume',105,'unit','tons','price',208,'quality_tier',2,'seed_tag',v_seed_tag)),
    (a7, 'offer', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','processed-ferrous-blend','material','processed ferrous blend','volume',92,'unit','tons','price',231,'quality_tier',1,'seed_tag',v_seed_tag));

  -- Feed: requests (demand)
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    -- Same-locality HYD many-to-one
    (a3, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',150,'max_price',236,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    -- Same-locality HYD one-to-many target (two buyers)
    (a4, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','processed-ferrous-blend','volume_needed',70,'max_price',244,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    -- Same-locality BLR one-to-many
    (a8, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','volume_needed',75,'max_price',236,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (a9, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','volume_needed',68,'max_price',233,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    -- Cross-locality HYD -> BLR (for hyd super)
    (a8, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',88,'max_price',248,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (a9, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',84,'max_price',246,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    -- Cross-locality BLR -> HYD (for blr super)
    (a3, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','volume_needed',82,'max_price',232,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (a4, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','volume_needed',79,'max_price',230,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    -- Logistics coordination demand
    (a5, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','cluster-transport-capacity','volume_needed',220,'max_price',26,'quality_tier_max',3,'target_specialist_type','specialist_logistics','seed_tag',v_seed_tag)),
    (a10, 'request', v_che, 'regional', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','intercity-transport-capacity','volume_needed',260,'max_price',29,'quality_tier_max',3,'target_specialist_type','specialist_logistics','seed_tag',v_seed_tag));

  -- Super visibility anchors (optional immediate UI signal)
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (a_super_hyd, 'announcement', v_hyd, 'local', true, jsonb_build_object('title','NexaApex HYD scan ready','description','Seeded same-locality and cross-locality opportunities for immediate multi-party proposal generation.','seed_tag',v_seed_tag)),
    (a_super_blr, 'announcement', v_blr, 'local', true, jsonb_build_object('title','NexaApex BLR scan ready','description','Seeded one-to-many and cross-locality demand clusters for NexaApex structuring.','seed_tag',v_seed_tag)),
    (a_super_che, 'announcement', v_che, 'regional', true, jsonb_build_object('title','NexaApex CHE logistics bridge ready','description','Intercity logistics support seeded for multi-locality deal support paths.','seed_tag',v_seed_tag));

  raise notice 'Seeded company pack (10 companies). seed_tag=%', v_seed_tag;
end $$;

