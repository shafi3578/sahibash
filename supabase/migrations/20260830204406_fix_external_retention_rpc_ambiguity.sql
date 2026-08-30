-- Remove an unnecessary unqualified RETURNING clause that conflicts with the
-- listing_id output parameter in PL/pgSQL. The logged CTE is intentionally
-- unreferenced: PostgreSQL still executes data-modifying CTEs exactly once.

create or replace function public.expire_due_forwarded_external_ads(p_limit integer default 100)
returns table(listing_id uuid, candidate_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 500 then raise exception 'Invalid retention batch size'; end if;

  return query
  with targets as (
    select listing.id
    from public.listings listing
    where listing.source_type = 'external_indexed'
      and listing.source_platform = 'telegram'
      and listing.ownership_status = 'unclaimed'
      and listing.provenance_status = 'permission_pending'
      and listing.expires_at <= now()
      and listing.status in ('approved', 'expired')
    order by listing.expires_at, listing.id
    limit p_limit
    for update skip locked
  ), expired as (
    update public.listings listing
    set status = 'expired', publication_status = 'archived', freshness_status = 'expired',
        allow_contact_display = false, noindex_external = true,
        removed_public_at = coalesce(listing.removed_public_at, now()), updated_at = now()
    from targets
    where listing.id = targets.id and listing.status = 'approved'
    returning listing.id
  ), logged as (
    insert into public.listing_provenance_events (
      listing_id, event_type, source_type, before_state, after_state, reason
    )
    select expired.id, 'external_retention_expired', 'external_indexed',
      jsonb_build_object('publication_status', 'published'),
      jsonb_build_object('publication_status', 'archived', 'retention_days', 30),
      'Forwarded external advertisement reached its 30-day retention limit'
    from expired
  )
  select targets.id, candidate.id
  from targets
  left join public.listing_ingest_candidates candidate on candidate.candidate_listing_id = targets.id;
end;
$$;

revoke all on function public.expire_due_forwarded_external_ads(integer) from public, anon, authenticated;
grant execute on function public.expire_due_forwarded_external_ads(integer) to service_role;

comment on function public.expire_due_forwarded_external_ads(integer) is
  'Service-only first phase: removes only due, unclaimed Telegram external ads from public discovery.';
