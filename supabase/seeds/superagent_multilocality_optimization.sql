-- Super-agent multi-locality optimization seed
-- 2 localities, 5 companies, one coordinated multi-locality super deal
-- Run after base Hyderabad seed

do $$
declare
  v_seed_tag text := 'super-multilocality-v1';
  v_loc_a text := 'hyderabad';
  v_loc_b text := 'bengaluru';

  v_super_hyd_company_id uuid;
  v_super_blr_company_id uuid;
  v_super_hyd_agent_id uuid;
  v_super_blr_agent_id uuid;

  v_hyd_supplier_company_id uuid;
  v_hyd_processor_company_id uuid;
  v_blr_buyer_company_id uuid;
  v_blr_secondary_buyer_company_id uuid;
  v_blr_logistics_company_id uuid;

  v_hyd_supplier_agent_id uuid;
  v_hyd_processor_agent_id uuid;
  v_blr_buyer_agent_id uuid;
  v_blr_secondary_buyer_agent_id uuid;
  v_blr_logistics_agent_id uuid;

  v_mp_deal_id uuid;
begin
  delete from public.agent_feed where content->>'seed_tag' = v_seed_tag;
  delete from public.deals where coalesce(agent_reasoning, '') ilike '%' || v_seed_tag || '%';
  delete from public.multi_party_deals where (value_distribution::text) ilike '%' || v_seed_tag || '%';

  -- Ensure super companies exist
  insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
  values
    ('NexaApex ' || v_loc_a, 'coordination', 'manufacturer', v_loc_a, jsonb_build_object('city', v_loc_a, 'country', 'IN'), true),
    ('NexaApex ' || v_loc_b, 'coordination', 'manufacturer', v_loc_b, jsonb_build_object('city', v_loc_b, 'country', 'IN'), true)
  on conflict do nothing;

  select id into v_super_hyd_company_id from public.companies where name = 'NexaApex ' || v_loc_a;
  select id into v_super_blr_company_id from public.companies where name = 'NexaApex ' || v_loc_b;

  insert into public.agents(company_id, name, agent_type, locality, status, constraints)
  values
    (v_super_hyd_company_id, 'NexaApex-' || v_loc_a, 'super', v_loc_a, 'active', jsonb_build_object('seed_tag', v_seed_tag)),
    (v_super_blr_company_id, 'NexaApex-' || v_loc_b, 'super', v_loc_b, 'active', jsonb_build_object('seed_tag', v_seed_tag))
  on conflict do nothing;

  select id into v_super_hyd_agent_id from public.agents where company_id = v_super_hyd_company_id and agent_type = 'super' order by created_at desc limit 1;
  select id into v_super_blr_agent_id from public.agents where company_id = v_super_blr_company_id and agent_type = 'super' order by created_at desc limit 1;

  -- 5 participating companies across 2 localities
  insert into public.companies(name, industry, entity_type, locality, location, is_setup_complete)
  values
    ('Demo HydraSteel Supplier (' || v_loc_a || ')', 'manufacturing', 'manufacturer', v_loc_a, jsonb_build_object('city', v_loc_a, 'country', 'IN'), true),
    ('Demo Deccan Processor (' || v_loc_a || ')', 'processing', 'processor', v_loc_a, jsonb_build_object('city', v_loc_a, 'country', 'IN'), true),
    ('Demo Bengaluru Auto Buyer (' || v_loc_b || ')', 'manufacturing', 'manufacturer', v_loc_b, jsonb_build_object('city', v_loc_b, 'country', 'IN'), true),
    ('Demo Bengaluru Infra Buyer (' || v_loc_b || ')', 'manufacturing', 'manufacturer', v_loc_b, jsonb_build_object('city', v_loc_b, 'country', 'IN'), true),
    ('Demo SouthLink Logistics (' || v_loc_b || ')', 'logistics', 'logistics', v_loc_b, jsonb_build_object('city', v_loc_b, 'country', 'IN'), true)
  on conflict do nothing;

  select id into v_hyd_supplier_company_id from public.companies where name = 'Demo HydraSteel Supplier (' || v_loc_a || ')';
  select id into v_hyd_processor_company_id from public.companies where name = 'Demo Deccan Processor (' || v_loc_a || ')';
  select id into v_blr_buyer_company_id from public.companies where name = 'Demo Bengaluru Auto Buyer (' || v_loc_b || ')';
  select id into v_blr_secondary_buyer_company_id from public.companies where name = 'Demo Bengaluru Infra Buyer (' || v_loc_b || ')';
  select id into v_blr_logistics_company_id from public.companies where name = 'Demo SouthLink Logistics (' || v_loc_b || ')';

  insert into public.agents(company_id, name, agent_type, locality, status, constraints)
  values
    (v_hyd_supplier_company_id, 'Nexa-HydraSteel', 'local', v_loc_a, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_hyd_processor_company_id, 'NexaPrime-Deccan-Processor', 'specialist_processor', v_loc_a, 'active', jsonb_build_object('input_materials', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_blr_buyer_company_id, 'Nexa-BLR-Auto', 'local', v_loc_b, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_blr_secondary_buyer_company_id, 'Nexa-BLR-Infra', 'local', v_loc_b, 'active', jsonb_build_object('material_categories', jsonb_build_array('ferrous-metals'), 'seed_tag', v_seed_tag)),
    (v_blr_logistics_company_id, 'NexaPrime-SouthLink-Logistics', 'specialist_logistics', v_loc_b, 'active', jsonb_build_object('service_regions', jsonb_build_array(v_loc_a, v_loc_b), 'seed_tag', v_seed_tag))
  on conflict do nothing;

  select id into v_hyd_supplier_agent_id from public.agents where company_id = v_hyd_supplier_company_id order by created_at desc limit 1;
  select id into v_hyd_processor_agent_id from public.agents where company_id = v_hyd_processor_company_id order by created_at desc limit 1;
  select id into v_blr_buyer_agent_id from public.agents where company_id = v_blr_buyer_company_id order by created_at desc limit 1;
  select id into v_blr_secondary_buyer_agent_id from public.agents where company_id = v_blr_secondary_buyer_company_id order by created_at desc limit 1;
  select id into v_blr_logistics_agent_id from public.agents where company_id = v_blr_logistics_company_id order by created_at desc limit 1;

  -- Create one multi-party coordinated deal (2 localities / 5 participants)
  insert into public.multi_party_deals(
    participating_company_ids,
    flows,
    value_distribution,
    total_annual_value,
    carbon_savings_tons_year,
    status,
    approvals,
    coordination_fee_percentage,
    coordinator_agent_id
  )
  values (
    array[
      v_hyd_supplier_company_id,
      v_hyd_processor_company_id,
      v_blr_buyer_company_id,
      v_blr_secondary_buyer_company_id,
      v_blr_logistics_company_id
    ],
    jsonb_build_array(
      jsonb_build_object('seller_company_id', v_hyd_supplier_company_id, 'buyer_company_id', v_hyd_processor_company_id, 'material_category', 'ferrous-metals', 'material_subtype', 'steel-turnings-clean', 'volume', 110, 'price_per_unit', 210),
      jsonb_build_object('seller_company_id', v_hyd_processor_company_id, 'buyer_company_id', v_blr_buyer_company_id, 'material_category', 'ferrous-metals', 'material_subtype', 'processed-billet-feed', 'volume', 70, 'price_per_unit', 248),
      jsonb_build_object('seller_company_id', v_hyd_processor_company_id, 'buyer_company_id', v_blr_secondary_buyer_company_id, 'material_category', 'ferrous-metals', 'material_subtype', 'processed-billet-feed', 'volume', 30, 'price_per_unit', 244)
    ),
    jsonb_build_object(
      v_hyd_supplier_company_id::text, 128000,
      v_hyd_processor_company_id::text, 182000,
      v_blr_buyer_company_id::text, 94000,
      v_blr_secondary_buyer_company_id::text, 56000,
      v_blr_logistics_company_id::text, 42000,
      'seed_tag', v_seed_tag
    ),
    502000,
    640,
    'proposed',
    jsonb_build_object(
      v_hyd_supplier_company_id::text, jsonb_build_object('approved', false),
      v_hyd_processor_company_id::text, jsonb_build_object('approved', false),
      v_blr_buyer_company_id::text, jsonb_build_object('approved', false),
      v_blr_secondary_buyer_company_id::text, jsonb_build_object('approved', false),
      v_blr_logistics_company_id::text, jsonb_build_object('approved', false)
    ),
    4,
    v_super_hyd_agent_id
  )
  returning id into v_mp_deal_id;

  -- Super-feed proposal visible across each locality, with financial estimate & involved companies
  insert into public.agent_feed(agent_id, post_type, locality, visibility, is_active, content)
  values
    (
      v_super_hyd_agent_id, 'deal_proposal', v_loc_a, 'local', true,
      jsonb_build_object(
        'summary', 'Multi-locality optimization: Hyderabad supply + processing to Bengaluru dual buyers via optimized logistics.',
        'multi_party_deal_id', v_mp_deal_id,
        'relation_type', 'many_to_one_and_one_to_many',
        'involved_company_ids', jsonb_build_array(v_hyd_supplier_company_id, v_hyd_processor_company_id, v_blr_buyer_company_id, v_blr_secondary_buyer_company_id, v_blr_logistics_company_id),
        'financial_estimate', jsonb_build_object(
          'baseline_annual_cost', 598000,
          'optimized_annual_cost', 502000,
          'estimated_savings', 96000,
          'savings_percentage', 16.1,
          'currency', 'EUR'
        ),
        'seed_tag', v_seed_tag
      )
    ),
    (
      v_super_blr_agent_id, 'deal_proposal', v_loc_b, 'local', true,
      jsonb_build_object(
        'summary', 'Bengaluru mirror view: dual buyer optimization fed by Hyderabad processed ferrous stream.',
        'multi_party_deal_id', v_mp_deal_id,
        'relation_type', 'many_to_one_and_one_to_many',
        'involved_company_ids', jsonb_build_array(v_hyd_supplier_company_id, v_hyd_processor_company_id, v_blr_buyer_company_id, v_blr_secondary_buyer_company_id, v_blr_logistics_company_id),
        'financial_estimate', jsonb_build_object(
          'baseline_annual_cost', 598000,
          'optimized_annual_cost', 502000,
          'estimated_savings', 96000,
          'savings_percentage', 16.1,
          'currency', 'EUR'
        ),
        'seed_tag', v_seed_tag
      )
    ),
    (
      v_super_hyd_agent_id, 'announcement', v_loc_a, 'local', true,
      jsonb_build_object(
        'title', 'Super-agent multi-locality optimization established',
        'description', '5-company chain with coordinated allocation and logistics now ready for participant approvals.',
        'multi_party_deal_id', v_mp_deal_id,
        'estimated_value', 502000,
        'estimated_savings', 96000,
        'carbon_saved', 640,
        'seed_tag', v_seed_tag
      )
    );

  raise notice 'Seeded multi-locality super deal id=% (seed_tag=%)', v_mp_deal_id, v_seed_tag;
end $$;

