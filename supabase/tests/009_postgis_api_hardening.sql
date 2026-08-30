begin;
select plan(8);

select ok(
  (select n.nspname = 'gis' from pg_extension e join pg_namespace n on n.oid = e.extnamespace where e.extname = 'postgis'),
  'PostGIS is installed in the isolated gis schema'
);
select ok(to_regclass('public.spatial_ref_sys') is null, 'PostGIS catalog is absent from public schema');
select ok(to_regclass('gis.spatial_ref_sys') is not null, 'PostGIS catalog exists in gis schema');
select ok(
  (select n.nspname = 'gis'
   from pg_attribute a
   join pg_class c on c.oid = a.attrelid
   join pg_namespace cn on cn.oid = c.relnamespace
   join pg_type t on t.oid = a.atttypid
   join pg_namespace n on n.oid = t.typnamespace
   where cn.nspname = 'public' and c.relname = 'places' and a.attname = 'location' and not a.attisdropped),
  'places.location uses the gis geography type'
);
select ok(not has_schema_privilege('anon', 'gis', 'USAGE'), 'anon cannot access the gis schema directly');
select ok(not has_schema_privilege('authenticated', 'gis', 'USAGE'), 'authenticated cannot access the gis schema directly');
select ok(
  (select count(*) = 0 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'st_estimatedextent'),
  'PostGIS estimator helpers are absent from public RPC schema'
);

set local role anon;
select lives_ok(
  'select id from public.nearby_places(61.452,5.857,5000) limit 1',
  'public nearby_places still works through the isolated PostGIS schema'
);

select * from finish();
rollback;
