-- Give the inventory review workflow an atomic, service-only way to resolve
-- candidates that must not be published. Every decision is retained in the
-- provenance ledger and job counters are recomputed from candidate state.

create or replace function public.resolve_ingest_candidate(
  p_candidate_id uuid,
  p_actor_id uuid,
  p_resolution text,
  p_reason text,
  p_duplicate_group_id uuid default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_candidate public.listing_ingest_candidates%rowtype;
  v_source public.listing_sources%rowtype;
  v_next_status public.listing_ingest_candidate_status;
  v_reason text;
begin
  if not public.is_super_administrator(p_actor_id)
     or not public.has_admin_permission(p_actor_id, 'listings.moderate') then
    raise exception 'Not authorized to resolve ingest candidates';
  end if;

  v_next_status := case lower(btrim(coalesce(p_resolution, '')))
    when 'rejected' then 'rejected'::public.listing_ingest_candidate_status
    when 'duplicate' then 'duplicate'::public.listing_ingest_candidate_status
    else null
  end;
  v_reason := left(btrim(coalesce(p_reason, '')), 1000);
  if v_next_status is null or char_length(v_reason) < 5 then
    raise exception 'A valid resolution and reason are required';
  end if;

  select * into v_candidate
  from public.listing_ingest_candidates
  where id = p_candidate_id
  for update;
  if not found then raise exception 'Candidate not found'; end if;
  if v_candidate.candidate_listing_id is not null or v_candidate.status = 'published' then
    raise exception 'Published candidates cannot be resolved';
  end if;

  select * into v_source from public.listing_sources where id = v_candidate.source_id;

  if v_next_status = 'duplicate' then
    if p_duplicate_group_id is null or p_duplicate_group_id = p_candidate_id then
      raise exception 'A duplicate must reference a different canonical candidate';
    end if;
    if not exists (
      select 1 from public.listing_ingest_candidates canonical
      where canonical.id = p_duplicate_group_id
        and canonical.source_id is not distinct from v_candidate.source_id
    ) then
      raise exception 'The canonical duplicate candidate is invalid';
    end if;
  elsif p_duplicate_group_id is not null then
    raise exception 'Rejected candidates cannot reference a duplicate group';
  end if;

  update public.listing_ingest_candidates
  set status = v_next_status,
      duplicate_group_id = case when v_next_status = 'duplicate' then p_duplicate_group_id else null end,
      validation_errors = jsonb_build_array(jsonb_build_object(
        'field', case when v_next_status = 'duplicate' then 'duplicate' else 'candidate' end,
        'code', v_next_status::text,
        'reason', v_reason
      )),
      updated_at = now()
  where id = v_candidate.id;

  insert into public.listing_provenance_events (
    listing_id, event_type, actor_user_id, source_type,
    before_state, after_state, reason, job_id
  ) values (
    null,
    case when v_next_status = 'duplicate' then 'candidate_marked_duplicate' else 'candidate_rejected' end,
    p_actor_id,
    v_source.source_type,
    jsonb_build_object('candidate_id', v_candidate.id, 'status', v_candidate.status),
    jsonb_build_object(
      'candidate_id', v_candidate.id,
      'status', v_next_status,
      'duplicate_group_id', case when v_next_status = 'duplicate' then p_duplicate_group_id else null end
    ),
    v_reason,
    v_candidate.job_id
  );

  update public.listing_ingest_jobs job
  set accepted_rows = (
        select count(*) from public.listing_ingest_candidates candidate
        where candidate.job_id = job.id and candidate.status = 'published'
      ),
      rejected_rows = (
        select count(*) from public.listing_ingest_candidates candidate
        where candidate.job_id = job.id and candidate.status in ('rejected', 'dead_letter')
      ),
      duplicate_rows = (
        select count(*) from public.listing_ingest_candidates candidate
        where candidate.job_id = job.id and candidate.status = 'duplicate'
      ),
      status = case
        when exists (
          select 1 from public.listing_ingest_candidates candidate
          where candidate.job_id = job.id
            and candidate.status in ('staged', 'validated', 'needs_review', 'publishable')
        ) then job.status
        else 'completed'::public.listing_ingest_job_status
      end,
      completed_at = case
        when exists (
          select 1 from public.listing_ingest_candidates candidate
          where candidate.job_id = job.id
            and candidate.status in ('staged', 'validated', 'needs_review', 'publishable')
        ) then job.completed_at
        else now()
      end,
      updated_at = now()
  where job.id = v_candidate.job_id;

  return v_next_status::text;
end;
$$;

revoke all on function public.resolve_ingest_candidate(uuid, uuid, text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.resolve_ingest_candidate(uuid, uuid, text, text, uuid)
  to service_role;

comment on function public.resolve_ingest_candidate(uuid, uuid, text, text, uuid) is
  'Service-only atomic rejection or duplicate resolution for reviewed external inventory candidates.';
