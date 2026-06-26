begin;

do $$
begin
  if exists (select 1 from pg_type where typname = 'listing_translation_status') then
    begin
      alter type public.listing_translation_status add value if not exists 'stale';
    exception when duplicate_object then
      null;
    end;
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_translation_status') then
    create type public.listing_translation_status as enum ('pending', 'completed', 'failed', 'stale', 'needs_review');
  end if;

  if not exists (select 1 from pg_type where typname = 'listing_translation_actor') then
    create type public.listing_translation_actor as enum ('ai', 'human', 'seller');
  end if;

  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('pending', 'processing', 'completed', 'failed');
  end if;
end $$;

alter table public.listings
  add column if not exists original_title text,
  add column if not exists original_description text,
  add column if not exists original_language text,
  add column if not exists original_locale text;

update public.listings
set
  original_title = coalesce(original_title, title),
  original_description = coalesce(original_description, description),
  original_language = coalesce(original_language, 'Unknown'),
  original_locale = coalesce(original_locale, 'en')
where original_title is null
   or original_description is null
   or original_language is null
   or original_locale is null;

create table if not exists public.listing_translations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  language_code text not null check (language_code in ('fa-AF', 'ps-AF', 'en')),
  title text not null,
  description text not null,
  normalized_keywords text,
  translation_status public.listing_translation_status not null default 'pending',
  translated_by public.listing_translation_actor not null default 'ai',
  translation_quality text,
  source_hash text,
  is_stale boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_translations_unique_listing_locale unique (listing_id, language_code)
);

create table if not exists public.listing_translation_jobs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  language_code text not null check (language_code in ('fa-AF', 'ps-AF', 'en')),
  source_hash text,
  status public.job_status not null default 'pending',
  attempts int not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists idx_listing_translations_listing_language
  on public.listing_translations(listing_id, language_code);
create index if not exists idx_listing_translations_status
  on public.listing_translations(translation_status, updated_at desc);
create index if not exists idx_listing_translations_keywords
  on public.listing_translations using gin (to_tsvector('simple', coalesce(normalized_keywords, '')));

create index if not exists idx_listing_translation_jobs_status
  on public.listing_translation_jobs(status, created_at);
create index if not exists idx_listing_translation_jobs_listing
  on public.listing_translation_jobs(listing_id, language_code);

create or replace function public.set_updated_at_listing_translation()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_listing_translations_updated_at on public.listing_translations;
create trigger trg_listing_translations_updated_at
before update on public.listing_translations
for each row execute function public.set_updated_at_listing_translation();

drop trigger if exists trg_listing_translation_jobs_updated_at on public.listing_translation_jobs;
create trigger trg_listing_translation_jobs_updated_at
before update on public.listing_translation_jobs
for each row execute function public.set_updated_at_listing_translation();

alter table public.listing_translations enable row level security;
alter table public.listing_translation_jobs enable row level security;

drop policy if exists "Public can read listing translations" on public.listing_translations;
create policy "Public can read listing translations"
on public.listing_translations
for select
using (exists (
  select 1 from public.listings l
  where l.id = listing_translations.listing_id
    and l.status = 'approved'
));

drop policy if exists "Admins manage listing translations" on public.listing_translations;
create policy "Admins manage listing translations"
on public.listing_translations
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins manage translation jobs" on public.listing_translation_jobs;
create policy "Admins manage translation jobs"
on public.listing_translation_jobs
for all
using (public.is_admin())
with check (public.is_admin());

commit;
