-- NexaApex simulated insights seed
-- Purpose: populate offer/request signals so Nexus "NexaApex Insights" shows
-- same-locality + cross-locality multi-party opportunities with actionable "Create Deal".
-- Safe to re-run.

do $$
declare
  v_seed_tag text := 'nexaapex-sim-insights-v1';
  v_hyd text := 'hyderabad';
  v_blr text := 'bengaluru';

  c_hyd_seller_a uuid;
  c_hyd_seller_b uuid;
  c_hyd_buyer_a uuid;
  c_hyd_buyer_b uuid;
  c_blr_seller_a uuid;
  c_blr_buyer_a uuid;
  c_blr_buyer_b uuid;

  a_hyd_seller_a uuid;
  a_hyd_seller_b uuid;
  a_hyd_buyer_a uuid;
  a_hyd_buyer_b uuid;
  a_blr_seller_a uuid;
  a_blr_buyer_a uuid;
  a_blr_buyer_b uuid;

  p_hyd_seller_a uuid;
  p_hyd_seller_b uuid;
  p_blr_seller_a uuid;
begin
  -- cleanup only this seed
  delete from public.agent_feed where content->>'seed_tag' = v_seed_tag;
  delete from public.material_passports where technical_properties->>'seed_tag' = v_seed_tag;

  -- companies
  insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
  values
    ('Demo Insight Hyd Seller A', 'recycling', 'recycler', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Insight Hyd Seller B', 'processing', 'processor', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Insight Hyd Buyer A', 'manufacturing', 'manufacturer', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Insight Hyd Buyer B', 'manufacturing', 'manufacturer', v_hyd, jsonb_build_object('city', v_hyd, 'country', 'IN'), true),
    ('Demo Insight Blr Seller A', 'recycling', 'recycler', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true),
    ('Demo Insight Blr Buyer A', 'manufacturing', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true),
    ('Demo Insight Blr Buyer B', 'manufacturing', 'manufacturer', v_blr, jsonb_build_object('city', v_blr, 'country', 'IN'), true)
  on conflict do nothing;

  select id into c_hyd_seller_a from public.companies where name = 'Demo Insight Hyd Seller A';
  select id into c_hyd_seller_b from public.companies where name = 'Demo Insight Hyd Seller B';
  select id into c_hyd_buyer_a from public.companies where name = 'Demo Insight Hyd Buyer A';
  select id into c_hyd_buyer_b from public.companies where name = 'Demo Insight Hyd Buyer B';
  select id into c_blr_seller_a from public.companies where name = 'Demo Insight Blr Seller A';
  select id into c_blr_buyer_a from public.companies where name = 'Demo Insight Blr Buyer A';
  select id into c_blr_buyer_b from public.companies where name = 'Demo Insight Blr Buyer B';

  -- agents
  insert into public.agents(company_id, name, agent_type, locality, status, constraints)
  values
    (c_hyd_seller_a, 'NexaPrime Insight Hyd Seller A', 'specialist_recycler', v_hyd, 'active', jsonb_build_object('seed_tag', v_seed_tag, 'accepted_material_categories', jsonb_build_array('ferrous-metals'))),
    (c_hyd_seller_b, 'NexaPrime Insight Hyd Seller B', 'specialist_processor', v_hyd, 'active', jsonb_build_object('seed_tag', v_seed_tag, 'input_materials', jsonb_build_array('ferrous-metals'))),
    (c_hyd_buyer_a, 'Nexa Insight Hyd Buyer A', 'local', v_hyd, 'active', jsonb_build_object('seed_tag', v_seed_tag, 'material_categories', jsonb_build_array('ferrous-metals'))),
    (c_hyd_buyer_b, 'Nexa Insight Hyd Buyer B', 'local', v_hyd, 'active', jsonb_build_object('seed_tag', v_seed_tag, 'material_categories', jsonb_build_array('ferrous-metals'))),
    (c_blr_seller_a, 'NexaPrime Insight Blr Seller A', 'specialist_recycler', v_blr, 'active', jsonb_build_object('seed_tag', v_seed_tag, 'accepted_material_categories', jsonb_build_array('ferrous-metals'))),
    (c_blr_buyer_a, 'Nexa Insight Blr Buyer A', 'local', v_blr, 'active', jsonb_build_object('seed_tag', v_seed_tag, 'material_categories', jsonb_build_array('ferrous-metals'))),
    (c_blr_buyer_b, 'Nexa Insight Blr Buyer B', 'local', v_blr, 'active', jsonb_build_object('seed_tag', v_seed_tag, 'material_categories', jsonb_build_array('ferrous-metals')))
  on conflict do nothing;

  select id into a_hyd_seller_a from public.agents where company_id = c_hyd_seller_a order by created_at desc limit 1;
  select id into a_hyd_seller_b from public.agents where company_id = c_hyd_seller_b order by created_at desc limit 1;
  select id into a_hyd_buyer_a from public.agents where company_id = c_hyd_buyer_a order by created_at desc limit 1;
  select id into a_hyd_buyer_b from public.agents where company_id = c_hyd_buyer_b order by created_at desc limit 1;
  select id into a_blr_seller_a from public.agents where company_id = c_blr_seller_a order by created_at desc limit 1;
  select id into a_blr_buyer_a from public.agents where company_id = c_blr_buyer_a order by created_at desc limit 1;
  select id into a_blr_buyer_b from public.agents where company_id = c_blr_buyer_b order by created_at desc limit 1;

  -- passports (so "Create Deal" can use buy logic cleanly)
  insert into public.material_passports(
    material_category, material_subtype, physical_form, unit, volume, quality_tier,
    verification_status, current_owner_company_id, technical_properties, is_active
  )
  values
    ('ferrous-metals', 'shredded-ferrous-scrap', 'solid', 'tons', 240, 2, 'verified', c_hyd_seller_a, jsonb_build_object('seed_tag', v_seed_tag), true),
    ('ferrous-metals', 'processed-ferrous-blend', 'solid', 'tons', 180, 1, 'verified', c_hyd_seller_b, jsonb_build_object('seed_tag', v_seed_tag), true),
    ('ferrous-metals', 'mixed-steel-offcuts', 'solid', 'tons', 210, 2, 'verified', c_blr_seller_a, jsonb_build_object('seed_tag', v_seed_tag), true);

  select id into p_hyd_seller_a from public.material_passports where current_owner_company_id = c_hyd_seller_a and technical_properties->>'seed_tag' = v_seed_tag order by created_at desc limit 1;
  select id into p_hyd_seller_b from public.material_passports where current_owner_company_id = c_hyd_seller_b and technical_properties->>'seed_tag' = v_seed_tag order by created_at desc limit 1;
  select id into p_blr_seller_a from public.material_passports where current_owner_company_id = c_blr_seller_a and technical_properties->>'seed_tag' = v_seed_tag order by created_at desc limit 1;

  -- offers: anchors for Create Deal
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (a_hyd_seller_a, 'offer', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','material','shredded ferrous scrap','volume',110,'unit','tons','price',212,'quality_tier',2,'passport_id',p_hyd_seller_a,'seed_tag',v_seed_tag)),
    (a_hyd_seller_b, 'offer', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','processed-ferrous-blend','material','processed ferrous blend','volume',85,'unit','tons','price',228,'quality_tier',1,'passport_id',p_hyd_seller_b,'seed_tag',v_seed_tag)),
    (a_blr_seller_a, 'offer', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','material','mixed steel offcuts','volume',95,'unit','tons','price',208,'quality_tier',2,'passport_id',p_blr_seller_a,'seed_tag',v_seed_tag));

  -- requests: same-locality + cross-locality multiparty patterns
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    -- same locality in Hyderabad
    (a_hyd_buyer_a, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',125,'max_price',238,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (a_hyd_buyer_b, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','processed-ferrous-blend','volume_needed',70,'max_price',246,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    -- cross locality HYD supply -> BLR demand
    (a_blr_buyer_a, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',90,'max_price',248,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (a_blr_buyer_b, 'request', v_blr, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','shredded-ferrous-scrap','volume_needed',84,'max_price',245,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    -- cross locality BLR supply -> HYD demand
    (a_hyd_buyer_a, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','volume_needed',88,'max_price',234,'quality_tier_max',2,'seed_tag',v_seed_tag)),
    (a_hyd_buyer_b, 'request', v_hyd, 'local', true, jsonb_build_object('material_category','ferrous-metals','material_subtype','mixed-steel-offcuts','volume_needed',81,'max_price',232,'quality_tier_max',2,'seed_tag',v_seed_tag));

  raise notice 'NexaApex simulated insights seed complete. seed_tag=%', v_seed_tag;
end $$;

