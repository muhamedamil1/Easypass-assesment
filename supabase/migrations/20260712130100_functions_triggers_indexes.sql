create function public.set_service_requests_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger service_requests_set_updated_at
before update on public.service_requests
for each row
execute function public.set_service_requests_updated_at();

create unique index companies_normalized_name_key
  on public.companies (lower(btrim(name)));

create index company_members_user_company_idx
  on public.company_members (user_id, company_id);

create index service_requests_company_created_at_idx
  on public.service_requests (company_id, created_at desc);

create unique index invoices_source_external_id_key
  on public.invoices (source, external_id);

create index invoices_company_idx
  on public.invoices (company_id);

create index invoices_source_updated_at_idx
  on public.invoices (source, source_updated_at desc);
