create or replace function public.nearby_places(p_lat double precision,p_lng double precision,p_radius_m integer default 5000)
returns table(id uuid,name text,category text,address text,latitude double precision,longitude double precision,distance_m double precision,report_count bigint)
language sql stable security definer set search_path=public as $$
  select p.id,p.name,p.category,p.address,st_y(p.location::geometry),st_x(p.location::geometry),
         st_distance(p.location,st_setsrid(st_makepoint(p_lng,p_lat),4326)::geography),
         (select count(*) from public.sense_reports sr where sr.place_id=p.id)
  from public.places p
  where st_dwithin(p.location,st_setsrid(st_makepoint(p_lng,p_lat),4326)::geography,greatest(100,least(p_radius_m,50000)))
  order by p.location <-> st_setsrid(st_makepoint(p_lng,p_lat),4326)::geography
  limit 200;
$$;
revoke all on function public.nearby_places(double precision,double precision,integer) from public;
grant execute on function public.nearby_places(double precision,double precision,integer) to anon,authenticated;
