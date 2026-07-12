create function public.sync_invoices(p_rows jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_received_count integer;
  v_duplicate_count integer;
  v_unmatched_count integer;
  v_inserted_count integer;
  v_updated_count integer;
  v_final_count integer;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'INVALID_ERP_PAYLOAD: expected a JSON array';
  end if;

  select count(*)
  into v_received_count
  from jsonb_array_elements(p_rows);

  with incoming as (
    select
      row_data->>'source' as source,
      row_data->>'external_id' as external_id
    from jsonb_array_elements(p_rows) as rows(row_data)
  )
  select count(*)
  into v_duplicate_count
  from (
    select source, external_id
    from incoming
    group by source, external_id
    having count(*) > 1
  ) duplicate_keys;

  if v_duplicate_count > 0 then
    raise exception 'CONFLICTING_SOURCE_VERSIONS: duplicate invoice identity in reduced input';
  end if;

  create temporary table tmp_sync_invoices (
    source text not null,
    external_id text not null,
    company_id uuid not null,
    source_company_name text not null,
    amount_aed numeric(14,2) not null,
    status public.invoice_status not null,
    source_updated_at timestamptz not null,
    raw_payload jsonb not null
  ) on commit drop;

  insert into tmp_sync_invoices (
    source,
    external_id,
    company_id,
    source_company_name,
    amount_aed,
    status,
    source_updated_at,
    raw_payload
  )
  select
    btrim(row_data->>'source'),
    btrim(row_data->>'external_id'),
    companies.id,
    row_data->>'source_company_name',
    (row_data->>'amount_aed')::numeric(14,2),
    (row_data->>'status')::public.invoice_status,
    (row_data->>'source_updated_at')::timestamptz,
    row_data
  from jsonb_array_elements(p_rows) as rows(row_data)
  join public.companies
    on lower(btrim(companies.name)) = lower(btrim(row_data->>'source_company_name'));

  select v_received_count - count(*)
  into v_unmatched_count
  from tmp_sync_invoices;

  if v_unmatched_count > 0 then
    raise exception 'UNMATCHED_COMPANY: one or more invoice companies could not be resolved';
  end if;

  with inserted as (
    insert into public.invoices (
      source,
      external_id,
      company_id,
      source_company_name,
      amount_aed,
      status,
      source_updated_at,
      last_synced_at,
      raw_payload
    )
    select
      source,
      external_id,
      company_id,
      source_company_name,
      amount_aed,
      status,
      source_updated_at,
      now(),
      raw_payload
    from tmp_sync_invoices
    on conflict (source, external_id) do nothing
    returning 1
  )
  select count(*) into v_inserted_count from inserted;

  with updated as (
    update public.invoices existing
    set
      company_id = incoming.company_id,
      source_company_name = incoming.source_company_name,
      amount_aed = incoming.amount_aed,
      status = incoming.status,
      source_updated_at = incoming.source_updated_at,
      last_synced_at = now(),
      raw_payload = incoming.raw_payload
    from tmp_sync_invoices incoming
    where existing.source = incoming.source
      and existing.external_id = incoming.external_id
      and incoming.source_updated_at > existing.source_updated_at
    returning 1
  )
  select count(*) into v_updated_count from updated;

  select count(*)
  into v_final_count
  from public.invoices;

  return jsonb_build_object(
    'received', v_received_count,
    'inserted', v_inserted_count,
    'updated', v_updated_count,
    'affected', v_inserted_count + v_updated_count,
    'final_count', v_final_count
  );
end;
$$;

revoke all on function public.sync_invoices(jsonb) from public;
revoke all on function public.sync_invoices(jsonb) from anon;
revoke all on function public.sync_invoices(jsonb) from authenticated;
grant execute on function public.sync_invoices(jsonb) to service_role;
