create or replace function public.record_listing_provenance_event(
  p_listing_id uuid,
  p_event_type text,
  p_after_state jsonb default '{}'::jsonb,
  p_reason text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_event_id uuid;
begin
  if v_actor is null then
    raise exception 'authentication required';
  end if;

  if not exists (
    select 1
    from public.listings l
    where l.id = p_listing_id
      and (
        l.user_id = v_actor
        or public.has_admin_permission(v_actor, 'listings.moderate')
      )
  ) then
    raise exception 'forbidden';
  end if;

  insert into public.listing_provenance_events (
    listing_id,
    event_type,
    actor_user_id,
    after_state,
    reason
  )
  values (
    p_listing_id,
    p_event_type,
    v_actor,
    coalesce(p_after_state, '{}'::jsonb),
    p_reason
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

revoke execute on function public.record_listing_provenance_event(uuid, text, jsonb, text) from public;
revoke execute on function public.record_listing_provenance_event(uuid, text, jsonb, text) from anon;
grant execute on function public.record_listing_provenance_event(uuid, text, jsonb, text) to authenticated, service_role;

drop policy if exists listing_provenance_events_system_insert on public.listing_provenance_events;
create policy listing_provenance_events_system_insert
on public.listing_provenance_events
for insert
to authenticated
with check (
  actor_user_id = (select auth.uid())
  and exists (
    select 1
    from public.listings l
    where l.id = listing_provenance_events.listing_id
      and (
        l.user_id = (select auth.uid())
        or public.has_admin_permission((select auth.uid()), 'listings.moderate')
      )
  )
);
