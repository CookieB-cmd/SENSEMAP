alter table public.moderation_items add column resolved_by uuid references auth.users(id), add column resolved_at timestamptz;

create or replace function public.check_contribution_rate_limit(p_user_id uuid,p_kind text) returns void language plpgsql security definer set search_path=public as $$
declare n integer; lim integer;
begin
 lim:=case p_kind when 'sense_reports' then 30 when 'live_reports' then 20 when 'comments' then 10 when 'content_flags' then 20 when 'place_change_suggestions' then 10 else null end;
 if lim is null then raise exception 'Unknown contribution kind'; end if;
 execute format('select count(*) from public.%I where %I=$1 and created_at>now()-interval ''1 hour''',p_kind,case when p_kind='content_flags' then 'reporter_id' else 'user_id' end) into n using p_user_id;
 if n>=lim then raise exception 'Rate limit exceeded for %',p_kind using errcode='P0001'; end if;
end $$;

-- separate trigger functions avoid referencing fields that do not exist in a row type
create or replace function public.rate_limit_user_contribution() returns trigger language plpgsql security definer set search_path=public as $$ begin perform public.check_contribution_rate_limit(new.user_id,tg_table_name); return new; end $$;
create or replace function public.rate_limit_flag_contribution() returns trigger language plpgsql security definer set search_path=public as $$ begin perform public.check_contribution_rate_limit(new.reporter_id,tg_table_name); return new; end $$;
create trigger sense_reports_rate before insert on public.sense_reports for each row execute function public.rate_limit_user_contribution();
create trigger live_reports_rate before insert on public.live_reports for each row execute function public.rate_limit_user_contribution();
create trigger comments_rate before insert on public.comments for each row execute function public.rate_limit_user_contribution();
create trigger changes_rate before insert on public.place_change_suggestions for each row execute function public.rate_limit_user_contribution();
create trigger flags_rate before insert on public.content_flags for each row execute function public.rate_limit_flag_contribution();

create or replace function public.queue_comment() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.moderation_items(entity_type,entity_id) values('comment',new.id); return new; end $$;
create or replace function public.queue_flag() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.moderation_items(entity_type,entity_id) values('content_flag',new.id); return new; end $$;
create or replace function public.queue_change() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.moderation_items(entity_type,entity_id) values('place_change_suggestion',new.id); return new; end $$;
create trigger comments_queue after insert on public.comments for each row execute function public.queue_comment();
create trigger flags_queue after insert on public.content_flags for each row execute function public.queue_flag();
create trigger changes_queue after insert on public.place_change_suggestions for each row execute function public.queue_change();

create or replace function public.resolve_moderation_item(p_item_id uuid,p_status public.moderation_status) returns void language plpgsql security definer set search_path=public as $$
declare item public.moderation_items;
begin
 if not public.is_moderator() then raise exception 'Moderator role required' using errcode='42501'; end if;
 if p_status not in ('approved','rejected') then raise exception 'Resolution must be approved or rejected'; end if;
 update public.moderation_items set status=p_status,resolved_by=(select auth.uid()),resolved_at=now() where id=p_item_id and status='pending' returning * into item;
 if item.id is null then raise exception 'Pending moderation item not found'; end if;
 if item.entity_type='comment' then update public.comments set status=p_status where id=item.entity_id;
 elsif item.entity_type='place_change_suggestion' then update public.place_change_suggestions set status=p_status where id=item.entity_id;
 end if;
end $$;
revoke all on function public.resolve_moderation_item(uuid,public.moderation_status) from public;
grant execute on function public.resolve_moderation_item(uuid,public.moderation_status) to authenticated;
