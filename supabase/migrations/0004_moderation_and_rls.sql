create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role='moderator'),
  created_at timestamptz not null default now()
);
create table public.moderation_items (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('comment','content_flag','place_change_suggestion')),
  entity_id uuid not null,
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);
create table public.content_flags (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null check (entity_type in ('place','comment','sense_report','live_report')),
  entity_id uuid not null,
  reason public.moderation_reason not null,
  detail text check (detail is null or char_length(detail) <= 500),
  created_at timestamptz not null default now()
);
create table public.place_change_suggestions (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  note text check (note is null or char_length(note) <= 500),
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);
create table public.external_query_cache (
  cache_key text primary key,
  provider text not null,
  response_json jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index external_query_cache_expiry_idx on public.external_query_cache(expires_at);

create or replace function public.is_moderator() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.user_roles r where r.user_id=(select auth.uid()) and r.role='moderator');
$$;
revoke all on function public.is_moderator() from public;
grant execute on function public.is_moderator() to authenticated;

alter table public.places enable row level security;
alter table public.place_facts enable row level security;
alter table public.sense_reports enable row level security;
alter table public.live_reports enable row level security;
alter table public.comments enable row level security;
alter table public.user_roles enable row level security;
alter table public.moderation_items enable row level security;
alter table public.content_flags enable row level security;
alter table public.place_change_suggestions enable row level security;
alter table public.external_query_cache enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.places, public.place_facts to anon, authenticated;
grant insert on public.sense_reports, public.live_reports, public.comments, public.content_flags, public.place_change_suggestions to authenticated;
grant select on public.comments, public.place_change_suggestions to authenticated;
grant select,update on public.moderation_items to authenticated;
grant select on public.user_roles, public.content_flags, public.sense_reports, public.live_reports to authenticated;

create policy places_public_read on public.places for select to anon,authenticated using (true);
create policy facts_public_read on public.place_facts for select to anon,authenticated using (true);
create policy sense_insert_own on public.sense_reports for insert to authenticated with check (user_id=(select auth.uid()));
create policy sense_moderator_read on public.sense_reports for select to authenticated using (public.is_moderator());
create policy live_insert_own on public.live_reports for insert to authenticated with check (user_id=(select auth.uid()));
create policy live_moderator_read on public.live_reports for select to authenticated using (public.is_moderator());
create policy comments_insert_own on public.comments for insert to authenticated with check (user_id=(select auth.uid()));
create policy comments_read_own_or_mod on public.comments for select to authenticated using (user_id=(select auth.uid()) or public.is_moderator());
create policy roles_mod_read on public.user_roles for select to authenticated using (public.is_moderator() or user_id=(select auth.uid()));
create policy moderation_mod_read on public.moderation_items for select to authenticated using (public.is_moderator());
create policy moderation_mod_update on public.moderation_items for update to authenticated using (public.is_moderator()) with check (public.is_moderator());
create policy flags_insert_own on public.content_flags for insert to authenticated with check (reporter_id=(select auth.uid()));
create policy flags_mod_read on public.content_flags for select to authenticated using (public.is_moderator());
create policy changes_insert_own on public.place_change_suggestions for insert to authenticated with check (user_id=(select auth.uid()));
create policy changes_read_own_or_mod on public.place_change_suggestions for select to authenticated using (user_id=(select auth.uid()) or public.is_moderator());
-- cache deliberately has no anon/auth policies; service-role Edge Functions manage it.
