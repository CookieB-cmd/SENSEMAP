create or replace function public.upsert_external_places(p_rows jsonb)
returns setof public.places language plpgsql security definer set search_path=public,gis as $$
declare r jsonb; saved public.places;
begin
  for r in select * from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb)) loop
    if coalesce(r->>'source_type','')='' or coalesce(r->>'source_id','')='' or coalesce(r->>'name','')='' then continue; end if;
    insert into public.places(source,source_type,source_id,name,category,address,location,source_tags)
    values('osm',r->>'source_type',r->>'source_id',r->>'name',nullif(r->>'category',''),nullif(r->>'address',''),
      gis.st_setsrid(gis.st_makepoint((r->>'longitude')::double precision,(r->>'latitude')::double precision),4326)::gis.geography,
      coalesce(r->'source_tags','{}'::jsonb))
    on conflict (source,source_type,source_id) where source_type is not null and source_id is not null
    do update set name=excluded.name,category=excluded.category,address=excluded.address,location=excluded.location,source_tags=excluded.source_tags,updated_at=now()
    returning * into saved;
    return next saved;
  end loop;
end $$;
revoke all on function public.upsert_external_places(jsonb) from public,anon,authenticated;
