-- Capabilities-first processed SKU mapping model

create table if not exists public.sku_processing_rules (
  id uuid primary key default gen_random_uuid(),
  waste_sku text not null,
  processed_sku text not null,
  processing_cost_per_ton numeric not null default 0,
  quality_factor numeric not null default 1,
  recovery_rate numeric not null default 0.7,
  net_cost_multiplier numeric not null default 1,
  pure_material_cost_per_ton numeric not null default 0,
  source_doc_version text,
  ingested_at timestamptz not null default now(),
  confidence numeric not null default 0.6,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (waste_sku, processed_sku, source_doc_version)
);

create index if not exists idx_sku_processing_rules_waste on public.sku_processing_rules (waste_sku);
create index if not exists idx_sku_processing_rules_processed on public.sku_processing_rules (processed_sku);

create table if not exists public.recycler_capability_mappings (
  id uuid primary key default gen_random_uuid(),
  waste_sku text not null,
  processed_sku text not null,
  source text not null default 'capabilities',
  quality_score integer,
  cost_competitiveness_score integer,
  recovery_score integer,
  market_demand_score integer,
  industry_segment text,
  source_doc_version text,
  ingested_at timestamptz not null default now(),
  confidence numeric not null default 0.85,
  is_active boolean not null default true,
  unique (waste_sku, processed_sku, source_doc_version)
);

create index if not exists idx_recycler_capability_mappings_waste on public.recycler_capability_mappings (waste_sku);
create index if not exists idx_recycler_capability_mappings_processed on public.recycler_capability_mappings (processed_sku);

create table if not exists public.sku_mapping_exceptions (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  row_ref text,
  waste_sku text,
  processed_sku text,
  reason text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);

create or replace view public.effective_processed_sku_mappings as
with capabilities as (
  select
    m.waste_sku,
    m.processed_sku,
    'capabilities'::text as source,
    m.quality_score,
    m.cost_competitiveness_score,
    m.recovery_score,
    m.market_demand_score,
    m.industry_segment,
    m.source_doc_version,
    m.ingested_at,
    m.confidence
  from public.recycler_capability_mappings m
  where m.is_active = true
),
rules as (
  select
    r.waste_sku,
    r.processed_sku,
    'sku_rules'::text as source,
    null::integer as quality_score,
    null::integer as cost_competitiveness_score,
    null::integer as recovery_score,
    null::integer as market_demand_score,
    null::text as industry_segment,
    r.source_doc_version,
    r.ingested_at,
    r.confidence
  from public.sku_processing_rules r
  where r.is_active = true
    and not exists (
      select 1
      from capabilities c
      where c.waste_sku = r.waste_sku
    )
)
select * from capabilities
union all
select * from rules;
