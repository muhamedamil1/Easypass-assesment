revoke all on schema private from public;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema private from public;

grant usage on schema public to anon, authenticated;
grant usage on schema private to authenticated;

grant select on table public.companies to authenticated;
grant select on table public.company_members to authenticated;
grant select, insert on table public.service_requests to authenticated;
grant update (status) on table public.service_requests to authenticated;

create function private.is_company_member(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
  );
$$;

create function private.is_company_admin(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and cm.role = 'admin'
  );
$$;

revoke all on function private.is_company_member(uuid) from public;
revoke all on function private.is_company_admin(uuid) from public;
grant execute on function private.is_company_member(uuid) to authenticated;
grant execute on function private.is_company_admin(uuid) to authenticated;

alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.service_requests enable row level security;
alter table public.invoices enable row level security;

create policy companies_select_member
on public.companies
for select
to authenticated
using (private.is_company_member(id));

create policy company_members_select_self
on public.company_members
for select
to authenticated
using (user_id = auth.uid());

create policy service_requests_select_member
on public.service_requests
for select
to authenticated
using (private.is_company_member(company_id));

create policy service_requests_insert_admin
on public.service_requests
for insert
to authenticated
with check (
  private.is_company_admin(company_id)
  and created_by = auth.uid()
);

create policy service_requests_update_admin
on public.service_requests
for update
to authenticated
using (private.is_company_admin(company_id))
with check (private.is_company_admin(company_id));
