create table public.sense_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  noise public.noise_level,
  lighting public.lighting_level,
  crowding public.crowd_level,
  toilet boolean,
  seating boolean,
  quiet_area boolean,
  step_free boolean,
  entrance_exit_clear boolean,
  strong_smells boolean,
  flashing_lights boolean,
  cramped_areas boolean,
  queue_common boolean,
  created_at timestamptz not null default now(),
  constraint sense_reports_has_observation check (
    noise is not null or lighting is not null or crowding is not null or toilet is not null or seating is not null or quiet_area is not null or step_free is not null or entrance_exit_clear is not null or strong_smells is not null or flashing_lights is not null or cramped_areas is not null or queue_common is not null
  )
);
create index sense_reports_place_created_idx on public.sense_reports(place_id,created_at desc);
create index sense_reports_user_created_idx on public.sense_reports(user_id,created_at desc);

create table public.live_reports (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  noise public.noise_level,
  crowding public.crowd_level,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  constraint live_reports_has_observation check (noise is not null or crowding is not null),
  constraint live_reports_expiry_after_creation check (expires_at > created_at)
);
create index live_reports_place_expiry_idx on public.live_reports(place_id,expires_at desc);
create index live_reports_user_created_idx on public.live_reports(user_id,created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  status public.moderation_status not null default 'pending',
  created_at timestamptz not null default now()
);
