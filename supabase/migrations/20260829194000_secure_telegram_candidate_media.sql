-- Keep imported Telegram media private and attach one stored image to each
-- actual Telegram message (message.photo contains size variants, not images).

create table if not exists public.listing_ingest_candidate_media (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.listing_ingest_candidates(id) on delete cascade,
  source_platform text not null default 'telegram',
  source_item_id text not null,
  source_file_fingerprint text not null,
  storage_bucket text not null default 'listing-ingest-media',
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  width int check (width is null or width > 0),
  height int check (height is null or height > 0),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_ingest_candidate_media_item_unique
    unique (candidate_id, source_platform, source_item_id),
  constraint listing_ingest_candidate_media_path_unique
    unique (storage_bucket, storage_path)
);

create index if not exists idx_listing_ingest_candidate_media_candidate_order
  on public.listing_ingest_candidate_media(candidate_id, sort_order, created_at);

alter table public.listing_ingest_candidate_media enable row level security;

drop policy if exists listing_ingest_candidate_media_admin_read
  on public.listing_ingest_candidate_media;
create policy listing_ingest_candidate_media_admin_read
  on public.listing_ingest_candidate_media for select to authenticated
  using ((select public.has_admin_permission((select auth.uid()), 'listings.view')));

drop policy if exists listing_ingest_candidate_media_super_admin_manage
  on public.listing_ingest_candidate_media;
create policy listing_ingest_candidate_media_super_admin_manage
  on public.listing_ingest_candidate_media for all to authenticated
  using ((select public.is_super_administrator((select auth.uid()))))
  with check ((select public.is_super_administrator((select auth.uid()))));

revoke all on table public.listing_ingest_candidate_media from anon, authenticated;
grant select, insert, update, delete on table public.listing_ingest_candidate_media to authenticated;
grant all on table public.listing_ingest_candidate_media to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-ingest-media',
  'listing-ingest-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']::text[];

drop policy if exists listing_ingest_media_admin_read on storage.objects;
create policy listing_ingest_media_admin_read
  on storage.objects for select to authenticated
  using (
    bucket_id = 'listing-ingest-media'
    and (select public.has_admin_permission((select auth.uid()), 'listings.view'))
  );

create or replace function public.sync_listing_ingest_candidate_photo_count()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_candidate_id uuid := coalesce(new.candidate_id, old.candidate_id);
  v_count int;
begin
  select count(*)::int into v_count
  from public.listing_ingest_candidate_media
  where candidate_id = v_candidate_id;

  update public.listing_ingest_candidates
  set normalized_payload = jsonb_set(
        coalesce(normalized_payload, '{}'::jsonb),
        '{photo_count}',
        to_jsonb(v_count),
        true
      ),
      updated_at = now()
  where id = v_candidate_id;
  return null;
end;
$$;

revoke all on function public.sync_listing_ingest_candidate_photo_count() from public, anon, authenticated;
grant execute on function public.sync_listing_ingest_candidate_photo_count() to service_role;

drop trigger if exists sync_listing_ingest_candidate_photo_count
  on public.listing_ingest_candidate_media;
create trigger sync_listing_ingest_candidate_photo_count
after insert or update of candidate_id or delete
on public.listing_ingest_candidate_media
for each row execute function public.sync_listing_ingest_candidate_photo_count();

-- Remove the legacy false count (Telegram size variants were counted as photos).
update public.listing_ingest_candidates
set normalized_payload = jsonb_set(
      coalesce(normalized_payload, '{}'::jsonb),
      '{photo_count}',
      '0'::jsonb,
      true
    ),
    updated_at = now()
where normalized_payload->>'source_platform' = 'telegram';
