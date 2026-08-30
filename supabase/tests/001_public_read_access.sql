begin;
select plan(2);
set local role anon;
select lives_ok('select id,name from public.places limit 1','anon can browse places');
select throws_ok($$insert into public.sense_reports(place_id,user_id,noise,crowding,lighting) values('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000099','quiet','few','soft')$$,'42501',null,'anon cannot contribute');
select * from finish();
rollback;
