create table public.provider_request_slots (
  provider text primary key,
  next_allowed_at timestamptz not null
);

alter table public.provider_request_slots enable row level security;
revoke all on public.provider_request_slots from anon, authenticated;

create or replace function public.claim_provider_request_slot(
  p_provider text,
  p_interval_ms integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_allowed_at timestamptz;
  v_now timestamptz := clock_timestamp();
begin
  if p_provider is null or btrim(p_provider) = '' then
    raise exception 'provider must not be empty';
  end if;

  if p_interval_ms is null or p_interval_ms < 0 or p_interval_ms > 60000 then
    raise exception 'interval must be between 0 and 60000 ms';
  end if;

  insert into public.provider_request_slots(provider, next_allowed_at)
  values (p_provider, '-infinity'::timestamptz)
  on conflict (provider) do nothing;

  select next_allowed_at
    into v_next_allowed_at
    from public.provider_request_slots
   where provider = p_provider
   for update;

  if v_next_allowed_at > v_now then
    return false;
  end if;

  update public.provider_request_slots
     set next_allowed_at = v_now + (p_interval_ms * interval '1 millisecond')
   where provider = p_provider;

  return true;
end;
$$;

revoke all on function public.claim_provider_request_slot(text, integer) from public;
revoke all on function public.claim_provider_request_slot(text, integer) from anon, authenticated;
grant execute on function public.claim_provider_request_slot(text, integer) to service_role;
