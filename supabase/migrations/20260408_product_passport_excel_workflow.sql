-- Product-level passports with multi-input/multi-output flow lines

create table if not exists public.product_passports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  product_code text not null,
  product_name text not null,
  reporting_period text,
  locality text,
  status text not null default 'active',
  technical_properties jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, product_code)
);

create index if not exists idx_product_passports_company on public.product_passports (company_id);

create table if not exists public.passport_input_lines (
  id uuid primary key default gen_random_uuid(),
  product_passport_id uuid not null references public.product_passports(id) on delete cascade,
  line_no integer not null default 1,
  input_sku text not null,
  input_material text,
  monthly_volume numeric not null default 0,
  unit text not null default 'tons',
  cost_per_unit numeric not null default 0,
  supplier text,
  quality_tier integer,
  processed_substitutes jsonb,
  score_breakdown jsonb,
  mapping_source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_passport_input_lines_passport on public.passport_input_lines (product_passport_id);
create index if not exists idx_passport_input_lines_sku on public.passport_input_lines (input_sku);

create table if not exists public.passport_output_lines (
  id uuid primary key default gen_random_uuid(),
  product_passport_id uuid not null references public.product_passports(id) on delete cascade,
  line_no integer not null default 1,
  waste_sku text not null,
  waste_material text,
  monthly_volume numeric not null default 0,
  unit text not null default 'tons',
  current_disposal_cost numeric not null default 0,
  potential_value numeric,
  quality_grade text,
  contamination_level numeric,
  classification text default 'recyclable',
  processed_sku_candidates jsonb,
  score_breakdown jsonb,
  mapping_source text,
  created_at timestamptz not null default now()
);

create index if not exists idx_passport_output_lines_passport on public.passport_output_lines (product_passport_id);
create index if not exists idx_passport_output_lines_sku on public.passport_output_lines (waste_sku);

create table if not exists public.excel_ingestion_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  file_name text not null,
  source_doc_version text,
  status text not null default 'uploaded',
  summary jsonb,
  errors jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_excel_ingestion_jobs_company on public.excel_ingestion_jobs (company_id);
