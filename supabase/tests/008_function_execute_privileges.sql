begin;
select plan(20);

-- Public read RPCs intentionally remain callable by visitors and signed-in users.
select ok(has_function_privilege('anon', 'public.nearby_places(double precision,double precision,integer)', 'EXECUTE'), 'anon can call nearby_places');
select ok(has_function_privilege('authenticated', 'public.nearby_places(double precision,double precision,integer)', 'EXECUTE'), 'authenticated can call nearby_places');
select ok(has_function_privilege('anon', 'public.get_place_profile(uuid)', 'EXECUTE'), 'anon can call get_place_profile');
select ok(has_function_privilege('authenticated', 'public.get_place_profile(uuid)', 'EXECUTE'), 'authenticated can call get_place_profile');

-- Moderator helpers are not visitor RPCs.
select ok(not has_function_privilege('anon', 'public.is_moderator()', 'EXECUTE'), 'anon cannot call is_moderator');
select ok(has_function_privilege('authenticated', 'public.is_moderator()', 'EXECUTE'), 'authenticated can call is_moderator');
select ok(not has_function_privilege('anon', 'public.resolve_moderation_item(uuid,public.moderation_status)', 'EXECUTE'), 'anon cannot resolve moderation items');
select ok(has_function_privilege('authenticated', 'public.resolve_moderation_item(uuid,public.moderation_status)', 'EXECUTE'), 'authenticated can call guarded moderation resolution');

-- Internal trigger/rate-limit helpers must never be exposed as client RPCs.
select ok(not has_function_privilege('anon', 'public.check_contribution_rate_limit(uuid,text)', 'EXECUTE'), 'anon cannot call contribution rate limit helper');
select ok(not has_function_privilege('authenticated', 'public.check_contribution_rate_limit(uuid,text)', 'EXECUTE'), 'authenticated cannot call contribution rate limit helper');
select ok(not has_function_privilege('anon', 'public.rate_limit_user_contribution()', 'EXECUTE'), 'anon cannot call user rate trigger helper');
select ok(not has_function_privilege('authenticated', 'public.rate_limit_user_contribution()', 'EXECUTE'), 'authenticated cannot call user rate trigger helper');
select ok(not has_function_privilege('anon', 'public.rate_limit_flag_contribution()', 'EXECUTE'), 'anon cannot call flag rate trigger helper');
select ok(not has_function_privilege('authenticated', 'public.rate_limit_flag_contribution()', 'EXECUTE'), 'authenticated cannot call flag rate trigger helper');
select ok(not has_function_privilege('anon', 'public.queue_comment()', 'EXECUTE'), 'anon cannot call comment queue trigger helper');
select ok(not has_function_privilege('authenticated', 'public.queue_comment()', 'EXECUTE'), 'authenticated cannot call comment queue trigger helper');
select ok(not has_function_privilege('anon', 'public.queue_flag()', 'EXECUTE'), 'anon cannot call flag queue trigger helper');
select ok(not has_function_privilege('authenticated', 'public.queue_flag()', 'EXECUTE'), 'authenticated cannot call flag queue trigger helper');
select ok(not has_function_privilege('anon', 'public.queue_change()', 'EXECUTE'), 'anon cannot call change queue trigger helper');
select ok(not has_function_privilege('authenticated', 'public.queue_change()', 'EXECUTE'), 'authenticated cannot call change queue trigger helper');

select * from finish();
rollback;
