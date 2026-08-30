begin;
select plan(8);

-- PostGIS catalog data is extension-owned and not part of the public SENSEMAP API.
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'spatial_ref_sys'), 'spatial_ref_sys has RLS enabled');
select ok(not has_table_privilege('anon', 'public.spatial_ref_sys', 'SELECT'), 'anon cannot read spatial_ref_sys directly');
select ok(not has_table_privilege('authenticated', 'public.spatial_ref_sys', 'SELECT'), 'authenticated cannot read spatial_ref_sys directly');

-- PostGIS estimator helpers are not application RPCs and should not be exposed through PostgREST.
select ok(not has_function_privilege('anon', 'public.st_estimatedextent(text,text)', 'EXECUTE'), 'anon cannot call st_estimatedextent(text,text)');
select ok(not has_function_privilege('authenticated', 'public.st_estimatedextent(text,text)', 'EXECUTE'), 'authenticated cannot call st_estimatedextent(text,text)');
select ok(not has_function_privilege('anon', 'public.st_estimatedextent(text,text,text)', 'EXECUTE'), 'anon cannot call st_estimatedextent(text,text,text)');
select ok(not has_function_privilege('authenticated', 'public.st_estimatedextent(text,text,text)', 'EXECUTE'), 'authenticated cannot call st_estimatedextent(text,text,text)');
select ok(not has_function_privilege('anon', 'public.st_estimatedextent(text,text,text,boolean)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.st_estimatedextent(text,text,text,boolean)', 'EXECUTE'), 'client roles cannot call st_estimatedextent(text,text,text,boolean)');

select * from finish();
rollback;
