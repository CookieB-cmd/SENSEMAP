create or replace function public.force_live_expiry() returns trigger language plpgsql set search_path=public as $$
begin new.expires_at:=new.created_at+interval '2 hours'; return new; end $$;
create trigger live_reports_force_expiry before insert or update on public.live_reports for each row execute function public.force_live_expiry();
