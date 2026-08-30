create table public.places (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('osm','community')),
  source_type text,
  source_id text,
  name text not null,
  category text,
  address text,
  location gis.geography(point,4326) not null,
  source_tags jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index places_external_identity_uq on public.places(source,source_type,source_id) where source_type is not null and source_id is not null;
create index places_location_gix on public.places using gist(location);

create table public.place_facts (
  place_id uuid primary key references public.places(id) on delete cascade,
  toilet boolean,
  seating boolean,
  quiet_area boolean,
  step_free boolean,
  entrance_exit_clear boolean,
  strong_smells boolean,
  flashing_lights boolean,
  cramped_areas boolean,
  queue_common boolean,
  updated_at timestamptz not null default now()
);
