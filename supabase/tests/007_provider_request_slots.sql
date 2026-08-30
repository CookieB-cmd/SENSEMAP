begin;
select plan(4);
select has_table('public', 'provider_request_slots', 'provider slot table exists');
select has_function('public', 'claim_provider_request_slot', array['text','integer'], 'slot RPC exists');
select ok(public.claim_provider_request_slot('nominatim-test', 1000), 'first request gets the slot');
select ok(not public.claim_provider_request_slot('nominatim-test', 1000), 'immediate second request is throttled');
select * from finish();
rollback;
