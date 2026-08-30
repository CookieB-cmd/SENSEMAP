create or replace function public.get_place_profile(p_place_id uuid) returns jsonb
language sql stable security definer set search_path=public as $$
with place_row as (
 select p.*, st_y(p.location::geometry) latitude, st_x(p.location::geometry) longitude from public.places p where p.id=p_place_id
), latest_sense as (
 select distinct on (user_id) * from public.sense_reports where place_id=p_place_id order by user_id,created_at desc
), latest_live as (
 select distinct on (user_id) * from public.live_reports where place_id=p_place_id and expires_at>now() order by user_id,created_at desc
), counts as (select count(*)::int n from latest_sense), live_counts as (select count(*)::int n,max(created_at) freshest from latest_live),
noise_mode as (select noise v,count(*) c from latest_sense where noise is not null group by noise order by count(*) desc, case noise when 'moderate' then 0 when 'quiet' then 1 else 2 end limit 1),
light_mode as (select lighting v,count(*) c from latest_sense where lighting is not null group by lighting order by count(*) desc, case lighting when 'normal' then 0 when 'soft' then 1 else 2 end limit 1),
crowd_mode as (select crowding v,count(*) c from latest_sense where crowding is not null group by crowding order by count(*) desc, case crowding when 'some' then 0 when 'few' then 1 else 2 end limit 1),
live_noise_mode as (select noise v,count(*) c from latest_live where noise is not null group by noise order by count(*) desc, case noise when 'moderate' then 0 when 'quiet' then 1 else 2 end limit 1),
live_crowd_mode as (select crowding v,count(*) c from latest_live where crowding is not null group by crowding order by count(*) desc, case crowding when 'some' then 0 when 'few' then 1 else 2 end limit 1),
fact_votes as (
 select
  case when count(toilet)>0 then count(*) filter(where toilet=true)>=count(*) filter(where toilet is not null)/2.0 else null end toilet,
  case when count(seating)>0 then count(*) filter(where seating=true)>=count(*) filter(where seating is not null)/2.0 else null end seating,
  case when count(quiet_area)>0 then count(*) filter(where quiet_area=true)>=count(*) filter(where quiet_area is not null)/2.0 else null end quiet_area,
  case when count(step_free)>0 then count(*) filter(where step_free=true)>=count(*) filter(where step_free is not null)/2.0 else null end step_free,
  case when count(entrance_exit_clear)>0 then count(*) filter(where entrance_exit_clear=true)>=count(*) filter(where entrance_exit_clear is not null)/2.0 else null end entrance_exit_clear,
  case when count(strong_smells)>0 then count(*) filter(where strong_smells=true)>=count(*) filter(where strong_smells is not null)/2.0 else null end strong_smells,
  case when count(flashing_lights)>0 then count(*) filter(where flashing_lights=true)>=count(*) filter(where flashing_lights is not null)/2.0 else null end flashing_lights,
  case when count(cramped_areas)>0 then count(*) filter(where cramped_areas=true)>=count(*) filter(where cramped_areas is not null)/2.0 else null end cramped_areas,
  case when count(queue_common)>0 then count(*) filter(where queue_common=true)>=count(*) filter(where queue_common is not null)/2.0 else null end queue_common
 from latest_sense
), effective_facts as (
 select coalesce(pf.toilet,fv.toilet) toilet,coalesce(pf.seating,fv.seating) seating,coalesce(pf.quiet_area,fv.quiet_area) quiet_area,
 coalesce(pf.step_free,fv.step_free) step_free,coalesce(pf.entrance_exit_clear,fv.entrance_exit_clear) entrance_exit_clear,
 coalesce(pf.strong_smells,fv.strong_smells) strong_smells,coalesce(pf.flashing_lights,fv.flashing_lights) flashing_lights,
 coalesce(pf.cramped_areas,fv.cramped_areas) cramped_areas,coalesce(pf.queue_common,fv.queue_common) queue_common
 from fact_votes fv left join public.place_facts pf on pf.place_id=p_place_id
)
select jsonb_build_object(
 'place',jsonb_build_object('id',p.id,'name',p.name,'category',p.category,'address',p.address,'latitude',p.latitude,'longitude',p.longitude,'distanceM',0,'reportCount',c.n,'personalFit',null),
 'facts',jsonb_build_object('toilet',f.toilet,'seating',f.seating,'quietArea',f.quiet_area,'stepFree',f.step_free,'entranceExitClear',f.entrance_exit_clear,'strongSmells',f.strong_smells,'flashingLights',f.flashing_lights,'crampedAreas',f.cramped_areas,'queueCommon',f.queue_common),
 'typical',jsonb_build_object('noise',(select v from noise_mode),'lighting',(select v from light_mode),'crowding',(select v from crowd_mode),'reportCount',c.n,'confidence',case when c.n=0 then 'none' when c.n<5 then 'limited' when c.n<15 then 'good' else 'high' end),
 'current',jsonb_build_object('noise',(select v from live_noise_mode),'crowding',(select v from live_crowd_mode),'reportCount',lc.n,'freshestAt',lc.freshest)
) from place_row p cross join counts c cross join live_counts lc cross join effective_facts f;
$$;
grant execute on function public.get_place_profile(uuid) to anon,authenticated;
