-- PostGIS is installed in public by the original v0.1 schema. Keep the extension
-- in place for RC compatibility, but do not expose its catalog table or estimator
-- helpers through the SENSEMAP Data API.

alter table public.spatial_ref_sys enable row level security;
revoke all on table public.spatial_ref_sys from public, anon, authenticated;

revoke execute on function public.st_estimatedextent(text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean) from public, anon, authenticated;
