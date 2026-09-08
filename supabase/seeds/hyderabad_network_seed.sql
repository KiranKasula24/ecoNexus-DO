-- Hyderabad network demo seed
-- Run in Supabase SQL Editor. Safe to re-run.

do $$
declare
  v_seed_tag text := 'hyd-network-seed-v2';
  v_locality text := 'hyderabad';

  v_buyer_company_id uuid;
  v_buyer_agent_id uuid;

  v_recycler_a_company_id uuid;
  v_recycler_b_company_id uuid;
  v_processor_a_company_id uuid;
  v_processor_b_company_id uuid;
  v_logistics_company_id uuid;
  v_maker_company_id uuid;
  v_super_company_id uuid;

  v_recycler_a_agent_id uuid;
  v_recycler_b_agent_id uuid;
  v_processor_a_agent_id uuid;
  v_processor_b_agent_id uuid;
  v_logistics_agent_id uuid;
  v_maker_agent_id uuid;
  v_super_agent_id uuid;

  v_passport_recycler_a uuid;
  v_passport_recycler_b uuid;
  v_passport_buyer uuid;

  v_offer_a_id uuid;
  v_offer_b_id uuid;
begin
  -- Primary buyer company in Hyderabad (prefer non-demo company).
  select c.id
  into v_buyer_company_id
  from public.companies c
  where c.locality = v_locality
    and c.name not ilike 'Demo %'
    and c.name not ilike 'NexaApex %'
  order by c.created_at desc
  limit 1;

  if v_buyer_company_id is null then
    select c.id
    into v_buyer_company_id
    from public.companies c
    where c.locality = v_locality
    order by c.created_at desc
    limit 1;
  end if;

  if v_buyer_company_id is null then
    raise exception 'No company found in locality %', v_locality;
  end if;

  -- Cleanup prior seed rows (re-runnable).
  delete from public.agent_feed
  where content->>'seed_tag' = v_seed_tag;

  delete from public.deals
  where coalesce(agent_reasoning, '') ilike '%' || v_seed_tag || '%';

  -- Demo companies.
  insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
  values
    ('Demo HydraCycle Recycler A (' || v_locality || ')', 'recycling', 'recycler', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo HydraCycle Recycler B (' || v_locality || ')', 'recycling', 'recycler', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo FerroFlux Processor A (' || v_locality || ')', 'processing', 'processor', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo FerroFlux Processor B (' || v_locality || ')', 'processing', 'processor', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo RouteGrid Logistics (' || v_locality || ')', 'logistics', 'logistics', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('Demo AlloyForge Manufacturer (' || v_locality || ')', 'manufacturing', 'manufacturer', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true),
    ('NexaApex ' || v_locality, 'coordination', 'manufacturer', v_locality, jsonb_build_object('city', v_locality, 'country', 'IN'), true)
  on conflict do nothing;

  select id into v_recycler_a_company_id from public.companies where name = 'Demo HydraCycle Recycler A (' || v_locality || ')';
  select id into v_recycler_b_company_id from public.companies where name = 'Demo HydraCycle Recycler B (' || v_locality || ')';
  select id into v_processor_a_company_id from public.companies where name = 'Demo FerroFlux Processor A (' || v_locality || ')';
  select id into v_processor_b_company_id from public.companies where name = 'Demo FerroFlux Processor B (' || v_locality || ')';
  select id into v_logistics_company_id from public.companies where name = 'Demo RouteGrid Logistics (' || v_locality || ')';
  select id into v_maker_company_id from public.companies where name = 'Demo AlloyForge Manufacturer (' || v_locality || ')';
  select id into v_super_company_id from public.companies where name = 'NexaApex ' || v_locality;

  -- Agents (create if missing).
  insert into public.agents(company_id, name, agent_type, locality, status, constraints)
  values
    (v_buyer_company_id, 'Nexa-Buyer-' || v_locality, 'local', v_locality, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_recycler_a_company_id, 'NexaPrime Recycler A - ' || v_locality, 'specialist_recycler', v_locality, 'active', jsonb_build_object('accepted_material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_recycler_b_company_id, 'NexaPrime Recycler B - ' || v_locality, 'specialist_recycler', v_locality, 'active', jsonb_build_object('accepted_material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_processor_a_company_id, 'NexaPrime Processor A - ' || v_locality, 'specialist_processor', v_locality, 'active', jsonb_build_object('input_materials', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_processor_b_company_id, 'NexaPrime Processor B - ' || v_locality, 'specialist_processor', v_locality, 'active', jsonb_build_object('input_materials', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_logistics_company_id, 'NexaPrime Logistics - ' || v_locality, 'specialist_logistics', v_locality, 'active', jsonb_build_object('service_regions', jsonb_build_array(v_locality), 'seed_tag', v_seed_tag)),
    (v_maker_company_id, 'Nexa-Demo AlloyForge - ' || v_locality, 'local', v_locality, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_super_company_id, 'NexaApex-' || v_locality, 'super', v_locality, 'active', jsonb_build_object('coordination_scope', 'locality', 'relation_modes', jsonb_build_array('many_to_one', 'one_to_many'), 'seed_tag', v_seed_tag))
  on conflict do nothing;

  select id into v_buyer_agent_id from public.agents where company_id = v_buyer_company_id and agent_type = 'local' order by created_at desc limit 1;
  select id into v_recycler_a_agent_id from public.agents where company_id = v_recycler_a_company_id and agent_type = 'specialist_recycler' order by created_at desc limit 1;
  select id into v_recycler_b_agent_id from public.agents where company_id = v_recycler_b_company_id and agent_type = 'specialist_recycler' order by created_at desc limit 1;
  select id into v_processor_a_agent_id from public.agents where company_id = v_processor_a_company_id and agent_type = 'specialist_processor' order by created_at desc limit 1;
  select id into v_processor_b_agent_id from public.agents where company_id = v_processor_b_company_id and agent_type = 'specialist_processor' order by created_at desc limit 1;
  select id into v_logistics_agent_id from public.agents where company_id = v_logistics_company_id and agent_type = 'specialist_logistics' order by created_at desc limit 1;
  select id into v_maker_agent_id from public.agents where company_id = v_maker_company_id and agent_type = 'local' order by created_at desc limit 1;
  select id into v_super_agent_id from public.agents where company_id = v_super_company_id and agent_type = 'super' order by created_at desc limit 1;

  -- Passports.
  insert into public.material_passports(
    passport_number, material_category, material_subtype, volume, unit, quality_tier,
    current_owner_company_id, current_location, material_properties, compliance_data, is_active, verification_status
  )
  values
    ('HYD-SEED-REC-A', 'ferrous-metals', 'shredded-ferrous-scrap', 320, 'tons', 2, v_recycler_a_company_id, jsonb_build_object('city', v_locality, 'country', 'IN'), jsonb_build_object('seed_tag', v_seed_tag), jsonb_build_object('seed_tag', v_seed_tag), true, 'verified'),
    ('HYD-SEED-REC-B', 'ferrous-metals', 'mixed-steel-offcuts', 240, 'tons', 2, v_recycler_b_company_id, jsonb_build_object('city', v_locality, 'country', 'IN'), jsonb_build_object('seed_tag', v_seed_tag), jsonb_build_object('seed_tag', v_seed_tag), true, 'verified'),
    ('HYD-SEED-BUYER', 'ferrous-metals', 'ferrous-mill-scale', 180, 'tons', 2, v_buyer_company_id, jsonb_build_object('city', v_locality, 'country', 'IN'), jsonb_build_object('seed_tag', v_seed_tag), jsonb_build_object('seed_tag', v_seed_tag), true, 'verified')
  on conflict (passport_number) do nothing;

  select id into v_passport_recycler_a from public.material_passports where passport_number = 'HYD-SEED-REC-A';
  select id into v_passport_recycler_b from public.material_passports where passport_number = 'HYD-SEED-REC-B';
  select id into v_passport_buyer from public.material_passports where passport_number = 'HYD-SEED-BUYER';

  -- Feed offers/requests/super announcements (many-to-one and one-to-many).
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (v_recycler_a_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','material','shredded ferrous scrap','volume',120,'unit','tons','price',212,'quality_tier',2,'passport_id',v_passport_recycler_a,'seed_tag',v_seed_tag)),
    (v_recycler_b_agent_id, 'offer', v_locality, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','material','mixed steel offcuts','volume',90,'unit','tons','price',205,'quality_tier',2,'passport_id',v_passport_recycler_b,'seed_tag',v_seed_tag)),
    (v_processor_a_agent_id, 'request', v_locality, 'local', true, jsonb_build_object('material_category','ferrous-metals','volume_needed',180,'max_price',228,'quality_tier_max',2,'min_volume',30,'target_specialist_type','specialist_processor','request_scope','nexaprime','seed_tag',v_seed_tag)),
    (v_logistics_agent_id, 'announcement', v_locality, 'local', true, jsonb_build_object('title','Cluster pickup window open','description','Backhaul slots opened for hyderabad recycler to processor routes this week.','annual_volume',480,'estimated_value',42000,'seed_tag',v_seed_tag)),
    (v_super_agent_id, 'announcement', v_locality, 'local', true, jsonb_build_object('title','Many-to-one opportunity detected','description','Two recyclers can jointly supply one anchor manufacturer with staged deliveries and pooled logistics.','companies_involved',jsonb_build_array('Demo HydraCycle Recycler A (' || v_locality || ')','Demo HydraCycle Recycler B (' || v_locality || ')'),'annual_volume',2100,'estimated_value',502000,'carbon_saved',620,'relation_type','many_to_one','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'announcement', v_locality, 'local', true, jsonb_build_object('title','One-to-many allocation opportunity','description','Single high-quality ferrous output can be split between processor and downstream manufacturer for higher margin.','companies_involved',jsonb_build_array('Demo FerroFlux Processor A (' || v_locality || ')','Demo AlloyForge Manufacturer (' || v_locality || ')'),'annual_volume',1650,'estimated_value',438000,'carbon_saved',510,'relation_type','one_to_many','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('summary','Super-agent proposes pooled recycler lots into one 3-round negotiation with buyer and logistics guardrails.','relation_type','many_to_one','seed_tag',v_seed_tag)),
    (v_super_agent_id, 'deal_proposal', v_locality, 'local', true, jsonb_build_object('summary','Super-agent proposes one-to-many split: anchor buyer plus processor with indexed price corridor.','relation_type','one_to_many','seed_tag',v_seed_tag));

  select id into v_offer_a_id
  from public.agent_feed
  where agent_id = v_recycler_a_agent_id and post_type = 'offer' and content->>'seed_tag' = v_seed_tag
  order by created_at desc
  limit 1;

  select id into v_offer_b_id
  from public.agent_feed
  where agent_id = v_recycler_b_agent_id and post_type = 'offer' and content->>'seed_tag' = v_seed_tag
  order by created_at desc
  limit 1;

  -- Pending deals for human approvals.
  insert into public.deals(
    seller_agent_id, buyer_agent_id, seller_company_id, buyer_company_id, passport_id,
    material_category, material_subtype, volume, unit, price_per_unit, total_value,
    status, negotiation_thread_id, quality_tier, duration_months, payment_terms, delivery_terms,
    agent_recommendation, agent_reasoning
  )
  values
    (v_recycler_a_agent_id, v_buyer_agent_id, v_recycler_a_company_id, v_buyer_company_id, v_passport_recycler_a,
     'ferrous-metals', 'shredded-ferrous-scrap', 55, 'tons', 212, 11660, 'pending_buyer_approval', v_offer_a_id, 2, 2, '30 days', 'Delivered',
     'approved', v_seed_tag || ': seeded pending buyer approval flow'),
    (v_buyer_agent_id, v_maker_agent_id, v_buyer_company_id, v_maker_company_id, v_passport_buyer,
     'ferrous-metals', 'ferrous-mill-scale', 35, 'tons', 198, 6930, 'pending_seller_approval', v_offer_b_id, 2, 1, '15 days', 'Buyer pickup',
     'approved', v_seed_tag || ': seeded pending seller approval flow');

  raise notice 'Hyderabad network seed completed. Buyer company id: %', v_buyer_company_id;
end $$;

