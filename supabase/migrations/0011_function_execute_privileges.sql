-- Supabase grants EXECUTE on newly created public-schema functions to API roles
-- through hosted/local default privileges. Internal trigger/rate-limit helpers are
-- not client RPCs, so revoke those grants explicitly.

-- Authenticated users need is_moderator() for RLS policy evaluation, but visitors do not.
revoke execute on function public.is_moderator() from anon;

-- Resolution remains callable by signed-in users and enforces moderator status internally.
revoke execute on function public.resolve_moderation_item(uuid, public.moderation_status) from anon;

-- Internal contribution rate-limit helpers are reached through table triggers only.
revoke execute on function public.check_contribution_rate_limit(uuid, text) from anon, authenticated;
revoke execute on function public.rate_limit_user_contribution() from anon, authenticated;
revoke execute on function public.rate_limit_flag_contribution() from anon, authenticated;

-- Moderation queue helpers are reached through table triggers only.
revoke execute on function public.queue_comment() from anon, authenticated;
revoke execute on function public.queue_flag() from anon, authenticated;
revoke execute on function public.queue_change() from anon, authenticated;
