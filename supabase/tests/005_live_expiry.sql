begin;
select plan(2);
insert into auth.users(id,email) values('40000000-0000-0000-0000-000000000001','live@example.invalid') on conflict do nothing;
insert into public.live_reports(id,place_id,user_id,noise,created_at,expires_at) values('41000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','quiet',date_trunc('second',now()),now()+interval '1 year');
select is((select expires_at-created_at from public.live_reports where id='41000000-0000-0000-0000-000000000001'),interval '2 hours','server forces two-hour live expiry');
update public.live_reports set created_at=now()-interval '4 hours' where id='41000000-0000-0000-0000-000000000001';
select is((public.get_place_profile('00000000-0000-0000-0000-000000000001')->'current'->>'reportCount')::int,0,'expired current rows do not influence profile');
select * from finish();
rollback;
