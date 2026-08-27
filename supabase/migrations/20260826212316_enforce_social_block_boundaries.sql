create or replace function public.enforce_message_block_boundary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.user_blocks b
    where (b.blocker_user_id = new.sender_user_id and b.blocked_user_id = new.recipient_user_id)
       or (b.blocker_user_id = new.recipient_user_id and b.blocked_user_id = new.sender_user_id)
  ) then
    raise exception 'Messaging is unavailable for this conversation'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_message_block_boundary() from public, anon, authenticated;

drop trigger if exists messages_block_boundary on public.messages;
create trigger messages_block_boundary
before insert on public.messages
for each row execute function public.enforce_message_block_boundary();

create or replace function public.enforce_follow_block_boundary()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.user_blocks b
    where (b.blocker_user_id = new.follower_user_id and b.blocked_user_id = new.following_user_id)
       or (b.blocker_user_id = new.following_user_id and b.blocked_user_id = new.follower_user_id)
  ) then
    raise exception 'Following is unavailable for this profile'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_follow_block_boundary() from public, anon, authenticated;

drop trigger if exists user_follows_block_boundary on public.user_follows;
create trigger user_follows_block_boundary
before insert on public.user_follows
for each row execute function public.enforce_follow_block_boundary();
