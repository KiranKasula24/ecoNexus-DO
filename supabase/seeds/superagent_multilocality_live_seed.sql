-- Super-agent live multiparty seed (Hyderabad + Bengaluru)
-- Run in Supabase SQL editor, then run one agent cycle.
-- Safe to re-run.

do $$
declare
  v_seed_tag text := 'super-live-multiparty-v1';
  v_hyd text := 'hyderabad';
  v_blr text := 'bengaluru';

  v_hyd_supplier_a_company uuid;
  v_hyd_supplier_b_company uuid;
  v_hyd_processor_company uuid;
  v_blr_buyer_a_company uuid;
  v_blr_buyer_b_company uuid;
  v_blr_logistics_company uuid;

  v_hyd_super_company uuid;
  v_blr_super_company uuid;

  v_hyd_supplier_a_agent uuid;
  v_hyd_supplier_b_agent uuid;
  v_hyd_processor_agent uuid;
  v_blr_buyer_a_agent uuid;
  v_blr_buyer_b_agent uuid;
  v_blr_logistics_agent uuid;

  v_hyd_super_agent uuid;
  v_blr_super_agent uuid;
begin
  -- Clean prior seed feed rows (do not delete existing business data).
  delete from public.agent_feed where content->>'seed_tag' = v_seed_tag;

  -- Create or fetch demo companies.
  select id into v_hyd_supplier_a_company from public.companies where name = 'Demo HydraFerrous Supplier A';
  if v_hyd_supplier_a_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('Demo HydraFerrous Supplier A', 'recycling', 'recycler', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true)
    returning id into v_hyd_supplier_a_company;
  end if;

  select id into v_hyd_supplier_b_company from public.companies where name = 'Demo HydraFerrous Supplier B';
  if v_hyd_supplier_b_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('Demo HydraFerrous Supplier B', 'recycling', 'recycler', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true)
    returning id into v_hyd_supplier_b_company;
  end if;

  select id into v_hyd_processor_company from public.companies where name = 'Demo HydraProcessor Hub';
  if v_hyd_processor_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('Demo HydraProcessor Hub', 'processing', 'processor', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true)
    returning id into v_hyd_processor_company;
  end if;

  select id into v_blr_buyer_a_company from public.companies where name = 'Demo Bengaluru Buyer A';
  if v_blr_buyer_a_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('Demo Bengaluru Buyer A', 'manufacturing', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true)
    returning id into v_blr_buyer_a_company;
  end if;

  select id into v_blr_buyer_b_company from public.companies where name = 'Demo Bengaluru Buyer B';
  if v_blr_buyer_b_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('Demo Bengaluru Buyer B', 'manufacturing', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true)
    returning id into v_blr_buyer_b_company;
  end if;

  select id into v_blr_logistics_company from public.companies where name = 'Demo Bengaluru RouteMesh Logistics';
  if v_blr_logistics_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('Demo Bengaluru RouteMesh Logistics', 'logistics', 'logistics', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true)
    returning id into v_blr_logistics_company;
  end if;

  -- Super wrapper companies (manufacturer used due entity_type constraint).
  select id into v_hyd_super_company from public.companies where name = 'NexaApex ' || v_hyd;
  if v_hyd_super_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('NexaApex ' || v_hyd, 'coordination', 'manufacturer', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true)
    returning id into v_hyd_super_company;
  end if;

  select id into v_blr_super_company from public.companies where name = 'NexaApex ' || v_blr;
  if v_blr_super_company is null then
    insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
    values ('NexaApex ' || v_blr, 'coordination', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true)
    returning id into v_blr_super_company;
  end if;

  -- Create or fetch agents.
  select id into v_hyd_supplier_a_agent from public.agents where company_id = v_hyd_supplier_a_company and agent_type = 'specialist_recycler' order by created_at desc limit 1;
  if v_hyd_supplier_a_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_hyd_supplier_a_company, 'NexaPrime Hydra Recycler A', 'specialist_recycler', v_hyd, 'active', jsonb_build_object('accepted_material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag))
    returning id into v_hyd_supplier_a_agent;
  end if;

  select id into v_hyd_supplier_b_agent from public.agents where company_id = v_hyd_supplier_b_company and agent_type = 'specialist_recycler' order by created_at desc limit 1;
  if v_hyd_supplier_b_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_hyd_supplier_b_company, 'NexaPrime Hydra Recycler B', 'specialist_recycler', v_hyd, 'active', jsonb_build_object('accepted_material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag))
    returning id into v_hyd_supplier_b_agent;
  end if;

  select id into v_hyd_processor_agent from public.agents where company_id = v_hyd_processor_company and agent_type = 'specialist_processor' order by created_at desc limit 1;
  if v_hyd_processor_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_hyd_processor_company, 'NexaPrime Hydra Processor', 'specialist_processor', v_hyd, 'active', jsonb_build_object('input_materials', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag))
    returning id into v_hyd_processor_agent;
  end if;

  select id into v_blr_buyer_a_agent from public.agents where company_id = v_blr_buyer_a_company and agent_type = 'local' order by created_at desc limit 1;
  if v_blr_buyer_a_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_blr_buyer_a_company, 'Nexa Bengaluru Buyer A', 'local', v_blr, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag))
    returning id into v_blr_buyer_a_agent;
  end if;

  select id into v_blr_buyer_b_agent from public.agents where company_id = v_blr_buyer_b_company and agent_type = 'local' order by created_at desc limit 1;
  if v_blr_buyer_b_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_blr_buyer_b_company, 'Nexa Bengaluru Buyer B', 'local', v_blr, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag))
    returning id into v_blr_buyer_b_agent;
  end if;

  select id into v_blr_logistics_agent from public.agents where company_id = v_blr_logistics_company and agent_type = 'specialist_logistics' order by created_at desc limit 1;
  if v_blr_logistics_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_blr_logistics_company, 'NexaPrime Bengaluru Logistics', 'specialist_logistics', v_blr, 'active', jsonb_build_object('service_regions', jsonb_build_array(v_hyd, v_blr), 'seed_tag', v_seed_tag))
    returning id into v_blr_logistics_agent;
  end if;

  select id into v_hyd_super_agent from public.agents where company_id = v_hyd_super_company and agent_type = 'super' order by created_at desc limit 1;
  if v_hyd_super_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_hyd_super_company, 'NexaApex-' || v_hyd, 'super', v_hyd, 'active', jsonb_build_object('coordination_scope', 'locality', 'cross_locality_enabled', true, 'seed_tag', v_seed_tag))
    returning id into v_hyd_super_agent;
  end if;

  select id into v_blr_super_agent from public.agents where company_id = v_blr_super_company and agent_type = 'super' order by created_at desc limit 1;
  if v_blr_super_agent is null then
    insert into public.agents(company_id, name, agent_type, locality, status, constraints)
    values (v_blr_super_company, 'NexaApex-' || v_blr, 'super', v_blr, 'active', jsonb_build_object('coordination_scope', 'locality', 'cross_locality_enabled', true, 'seed_tag', v_seed_tag))
    returning id into v_blr_super_agent;
  end if;

  -- Core marketplace signals for super-agent detection.
  -- Hyderabad offers (supply cluster).
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_hyd_supplier_a_agent, 'offer', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','material','shredded ferrous scrap','volume',120,'unit','tons','price',212,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_hyd_supplier_b_agent, 'offer', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','material','mixed steel offcuts','volume',95,'unit','tons','price',206,'quality_tier',2,'seed_tag',v_seed_tag)),
    (v_hyd_processor_agent, 'offer', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','processed-ferrous-blend','material','processed ferrous blend','volume',80,'unit','tons','price',224,'quality_tier',1,'seed_tag',v_seed_tag));

  -- Bengaluru requests (cross-locality demand cluster).
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_blr_buyer_a_agent, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',100,'max_price',245,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (v_blr_buyer_b_agent, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','volume_needed',85,'max_price',238,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (v_blr_logistics_agent, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','cluster-transport-capacity','volume_needed',150,'max_price',30,'quality_tier_max',3,'seed_tag',v_seed_tag));

  -- Same-locality Hyderabad demand to force many-to-one and one-to-many local structures.
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_hyd_processor_agent, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',140,'max_price',230,'quality_tier_max',2,'seed_tag',v_seed_tag));

  raise notice 'Super-agent live multiparty seed done. seed_tag=%', v_seed_tag;
end $$;

