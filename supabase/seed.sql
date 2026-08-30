insert into public.places(id,source,source_type,source_id,name,category,address,location) values
('00000000-0000-0000-0000-000000000001','osm','node','1001','Test Library','library','1 Testgata',gis.st_setsrid(gis.st_makepoint(5.857,61.452),4326)::gis.geography),
('00000000-0000-0000-0000-000000000002','osm','node','1002','Test Café','cafe','2 Testgata',gis.st_setsrid(gis.st_makepoint(5.860,61.453),4326)::gis.geography),
('00000000-0000-0000-0000-000000000003','osm','node','1003','Test Park','park','3 Testgata',gis.st_setsrid(gis.st_makepoint(5.855,61.451),4326)::gis.geography)
on conflict do nothing;
insert into public.place_facts(place_id,toilet,seating,quiet_area,step_free) values
('00000000-0000-0000-0000-000000000001',true,true,true,true),
('00000000-0000-0000-0000-000000000002',true,true,false,true)
on conflict(place_id) do update set toilet=excluded.toilet,seating=excluded.seating,quiet_area=excluded.quiet_area,step_free=excluded.step_free;

insert into auth.users(id,email) values
('60000000-0000-0000-0000-000000000001','seed1@example.invalid'),
('60000000-0000-0000-0000-000000000002','seed2@example.invalid'),
('60000000-0000-0000-0000-000000000003','seed3@example.invalid'),
('60000000-0000-0000-0000-000000000004','seed4@example.invalid'),
('60000000-0000-0000-0000-000000000005','seed5@example.invalid')
on conflict do nothing;
insert into public.sense_reports(place_id,user_id,noise,lighting,crowding,seating,quiet_area,step_free) values
('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','quiet','soft','few',true,true,true),
('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000002','quiet','soft','few',true,true,true),
('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003','quiet','normal','few',true,true,true),
('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000004','quiet','soft','some',true,true,true),
('00000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000005','moderate','soft','few',true,true,true),
('00000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000001','loud','strong','busy',true,false,true)
on conflict do nothing;
