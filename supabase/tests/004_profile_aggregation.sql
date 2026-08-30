begin;
select plan(4);
insert into auth.users(id,email) select ('30000000-0000-0000-0000-00000000000'||g)::uuid,'u'||g||'@example.invalid' from generate_series(1,6) g on conflict do nothing;
insert into public.sense_reports(place_id,user_id,noise,lighting,crowding) values
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','quiet','soft','few'),
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002','quiet','soft','few'),
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000003','quiet','normal','few'),
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000004','quiet','soft','some'),
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000005','loud','strong','busy');
insert into public.live_reports(place_id,user_id,noise,crowding,created_at,expires_at) values
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000005','loud','busy',now()-interval '3 hours',now()-interval '1 hour'),
('00000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000006','moderate','some',now(),now()+interval '2 hours');
select is(public.get_place_profile('00000000-0000-0000-0000-000000000003')->'typical'->>'noise','quiet','one loud outlier cannot dominate');
select is((public.get_place_profile('00000000-0000-0000-0000-000000000003')->'typical'->>'reportCount')::int,5,'counts independent latest contributors');
select is(public.get_place_profile('00000000-0000-0000-0000-000000000003')->'current'->>'noise','moderate','expired live report is ignored');
select ok(position('user_id' in public.get_place_profile('00000000-0000-0000-0000-000000000003')::text)=0,'public profile exposes no contributor identity');
select * from finish();
rollback;
