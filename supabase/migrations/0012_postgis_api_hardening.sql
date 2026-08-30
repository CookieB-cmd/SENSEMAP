-- PostGIS is installed in public by the original v0.1 schema. Keep the extension
-- in place for RC compatibility while testing whether client grants can be
-- removed without changing the extension-owned spatial_ref_sys table itself.

revoke all on table public.spatial_ref_sys from public, anon, authenticated;

revoke execute on function public.st_estimatedextent(text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text) from public, anon, authenticated;
revoke execute on function public.st_estimatedextent(text, text, text, boolean) from public, anon, authenticated;
