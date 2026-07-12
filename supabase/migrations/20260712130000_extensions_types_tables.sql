create schema if not exists private;

create type public.company_member_role as enum ('admin', 'viewer');
create type public.service_request_status as enum (
  'submitted',
  'in_progress',
  'completed'
);
create type public.invoice_status as enum ('paid', 'unpaid');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  constraint companies_name_length_check
    check (char_length(btrim(name)) between 1 and 200)
);

create table public.company_members (
  company_id uuid not null
    references public.companies(id) on delete cascade,
  user_id uuid not null
    references auth.users(id) on delete cascade,
  role public.company_member_role not null,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null
    references public.companies(id) on delete restrict,
  title text not null,
  status public.service_request_status not null default 'submitted',
  created_by uuid not null
    references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint service_requests_title_length_check
    check (char_length(btrim(title)) between 1 and 200)
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  external_id text not null,
  company_id uuid not null
    references public.companies(id) on delete restrict,
  source_company_name text not null,
  amount_aed numeric(14,2) not null,
  status public.invoice_status not null,
  source_updated_at timestamptz not null,
  first_synced_at timestamptz not null default now(),
  last_synced_at timestamptz not null default now(),
  raw_payload jsonb not null,
  constraint invoices_source_nonblank_check
    check (char_length(btrim(source)) > 0),
  constraint invoices_external_id_nonblank_check
    check (char_length(btrim(external_id)) > 0),
  constraint invoices_source_company_name_nonblank_check
    check (char_length(btrim(source_company_name)) > 0),
  constraint invoices_amount_aed_nonnegative_check
    check (amount_aed >= 0),
  constraint invoices_raw_payload_object_check
    check (jsonb_typeof(raw_payload) = 'object')
);
