create or replace function public.nearby_places(p_lat double precision,p_lng double precision,p_radius_m integer default 5000)
returns table(id uuid,name text,category text,address text,latitude double precision,longitude double precision,distance_m double precision,report_count bigint)
language sql stable security definer set search_path=public,gis as $$
  select p.id,p.name,p.category,p.address,gis.st_y(p.location::gis.geometry),gis.st_x(p.location::gis.geometry),
         gis.st_distance(p.location,gis.st_setsrid(gis.st_makepoint(p_lng,p_lat),4326)::gis.geography),
         (select count(*) from public.sense_reports sr where sr.place_id=p.id)
  from public.places p
  where gis.st_dwithin(p.location,gis.st_setsrid(gis.st_makepoint(p_lng,p_lat),4326)::gis.geography,greatest(100,least(p_radius_m,50000)))
  order by p.location <-> gis.st_setsrid(gis.st_makepoint(p_lng,p_lat),4326)::gis.geography
  limit 200;
$$;
revoke all on function public.nearby_places(double precision,double precision,integer) from public;
grant execute on function public.nearby_places(double precision,double precision,integer) to anon,authenticated;
