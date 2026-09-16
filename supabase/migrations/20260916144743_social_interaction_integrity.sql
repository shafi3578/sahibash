-- Preserve existing records and RLS scopes. Constrain future client mutations
-- and make the message metric / reciprocal block cleanup trigger-owned.
-- RLS does not protect TRUNCATE; API roles never need these DDL-like privileges.
revoke truncate, trigger, references on public.messages, public.reports from anon, authenticated;

-- All three operations serialize on the same unordered user pair. Separate
-- VOLATILE statements take a fresh READ COMMITTED snapshot after a lock wait.
create or replace function private.lock_social_pair(first_user uuid, second_user uuid)
returns void
language plpgsql
volatile
set search_path = ''
as $$
begin
  if first_user is null or second_user is null then
    raise exception 'Invalid social participants' using errcode = '42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(
    'social-interaction:' || least(first_user, second_user)::text || ':' || greatest(first_user, second_user)::text,
    0
  ));
end;
$$;
revoke all on function private.lock_social_pair(uuid, uuid) from public, anon, authenticated, service_role;

create or replace function public.enforce_message_block_boundary()
returns trigger
language plpgsql
security definer
volatile
set search_path = ''
as $$
begin
  if auth.uid() is null or new.sender_user_id is distinct from auth.uid() then
    raise exception 'Invalid message sender' using errcode = '42501';
  end if;
  perform private.lock_social_pair(new.sender_user_id, new.recipient_user_id);
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_user_id = new.sender_user_id and b.blocked_user_id = new.recipient_user_id)
       or (b.blocker_user_id = new.recipient_user_id and b.blocked_user_id = new.sender_user_id)
  ) then
    raise exception 'Messaging is unavailable for this conversation' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_message_block_boundary() from public, anon, authenticated, service_role;

create or replace function public.enforce_follow_block_boundary()
returns trigger
language plpgsql
security definer
volatile
set search_path = ''
as $$
begin
  if auth.uid() is null or new.follower_user_id is distinct from auth.uid() then
    raise exception 'Invalid follow owner' using errcode = '42501';
  end if;
  perform private.lock_social_pair(new.follower_user_id, new.following_user_id);
  if exists (
    select 1 from public.user_blocks b
    where (b.blocker_user_id = new.follower_user_id and b.blocked_user_id = new.following_user_id)
       or (b.blocker_user_id = new.following_user_id and b.blocked_user_id = new.follower_user_id)
  ) then
    raise exception 'Following is unavailable for this profile' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function public.enforce_follow_block_boundary() from public, anon, authenticated, service_role;

create or replace function private.guard_block_insert()
returns trigger
language plpgsql
security definer
volatile
set search_path = ''
as $$
begin
  if auth.uid() is null or new.blocker_user_id is distinct from auth.uid() then
    raise exception 'Invalid block owner' using errcode = '42501';
  end if;
  perform private.lock_social_pair(new.blocker_user_id, new.blocked_user_id);
  new.created_at := now();
  return new;
end;
$$;
revoke all on function private.guard_block_insert() from public, anon, authenticated, service_role;
create trigger user_blocks_integrity_guard
before insert on public.user_blocks
for each row execute function private.guard_block_insert();

create or replace function private.guard_message_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  admin_mutation boolean := coalesce(private.is_aal2() and public.is_admin(actor_id), false);
begin
  if tg_op = 'INSERT' then
    if actor_id is null or new.sender_user_id is distinct from actor_id
       or new.status is distinct from 'sent'::public.message_status
       or new.read_at is not null or new.deleted_by_sender or new.deleted_by_recipient then
      raise exception 'Invalid initial message state' using errcode = '42501';
    end if;
    new.created_at := now();
    return new;
  end if;

  if actor_id is null or (actor_id is distinct from old.recipient_user_id and not admin_mutation) then
    raise exception 'Message update unavailable' using errcode = '42501';
  end if;
  if row(new.id, new.listing_id, new.sender_user_id, new.recipient_user_id, new.body, new.created_at)
     is distinct from row(old.id, old.listing_id, old.sender_user_id, old.recipient_user_id, old.body, old.created_at) then
    raise exception 'Message content and attribution are immutable' using errcode = '42501';
  end if;
  if not admin_mutation and row(new.deleted_by_sender, new.deleted_by_recipient)
     is distinct from row(old.deleted_by_sender, old.deleted_by_recipient) then
    raise exception 'Only message read state can be changed' using errcode = '42501';
  end if;

  -- Client clocks never establish a receipt. Repeated reads retain the original
  -- receipt; marking unread clears it and a subsequent read gets a new receipt.
  new.read_at := case when new.status = 'read' then
    case when old.status = 'read' then coalesce(old.read_at, now()) else now() end
    else null end;
  return new;
end;
$$;
revoke all on function private.guard_message_integrity() from public, anon, authenticated, service_role;
create trigger messages_integrity_guard
before insert or update on public.messages
for each row execute function private.guard_message_integrity();

create or replace function private.adjust_message_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.sender_user_id is distinct from auth.uid() then
    raise exception 'Invalid message sender' using errcode = '42501';
  end if;
  -- Same target boundary as messages_insert_sender_only. The guarded UPDATE
  -- locks the listing and rechecks eligibility after a concurrent row update.
  -- Only messages_count (plus its existing updated_at trigger) is modified.
  update public.listings as listing
  set messages_count = listing.messages_count + 1
  where listing.id = new.listing_id
    and listing.user_id is not null
    and listing.user_id in (new.sender_user_id, new.recipient_user_id)
    and listing.status = 'approved'
    and listing.publication_status = 'published'
    and (listing.source_type = 'native' or listing.ownership_status = 'claimed');
  if not found then
    raise exception 'Message target unavailable' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.adjust_message_count() from public, anon, authenticated, service_role;
drop trigger trg_messages_adjust_count_ins on public.messages;
create trigger trg_messages_adjust_count_ins
after insert on public.messages
for each row execute function private.adjust_message_count();
revoke all on function public.adjust_message_count() from public, anon, authenticated, service_role;

create or replace function private.remove_blocked_follows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or new.blocker_user_id is distinct from auth.uid() then
    raise exception 'Invalid block owner' using errcode = '42501';
  end if;
  -- The block row itself records who blocked whom and when. Do not copy this
  -- private relationship into broadly readable notification or audit payloads.
  delete from public.user_follows as follow
  where (follow.follower_user_id = new.blocker_user_id and follow.following_user_id = new.blocked_user_id)
     or (follow.follower_user_id = new.blocked_user_id and follow.following_user_id = new.blocker_user_id);
  return new;
end;
$$;
revoke all on function private.remove_blocked_follows() from public, anon, authenticated, service_role;
create trigger user_blocks_remove_follows
after insert on public.user_blocks
for each row execute function private.remove_blocked_follows();

create or replace function private.guard_report_integrity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
begin
  if tg_op = 'INSERT' then
    if actor_id is null or new.reporter_user_id is distinct from actor_id
       or new.status is distinct from 'open'::public.report_status
       or new.admin_note is not null or new.resolved_by is not null or new.resolved_at is not null then
      raise exception 'Reports must start unresolved' using errcode = '42501';
    end if;
    new.created_at := now();
  else
    if actor_id is null or not coalesce(private.is_aal2() and public.is_admin(actor_id), false) then
      raise exception 'Report review requires administrator MFA' using errcode = '42501';
    end if;
    if row(new.id, new.listing_id, new.reporter_user_id, new.reason, new.details, new.created_at)
       is distinct from row(old.id, old.listing_id, old.reporter_user_id, old.reason, old.details, old.created_at) then
      raise exception 'Original report is immutable' using errcode = '42501';
    end if;
    if new.status = 'open' then
      new.resolved_by := null;
      new.resolved_at := null;
    elsif row(new.status, new.admin_note) is distinct from row(old.status, old.admin_note) then
      new.resolved_by := actor_id;
      new.resolved_at := now();
    else
      new.resolved_by := old.resolved_by;
      new.resolved_at := old.resolved_at;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.guard_report_integrity() from public, anon, authenticated, service_role;
create trigger reports_integrity_guard
before insert or update on public.reports
for each row execute function private.guard_report_integrity();
