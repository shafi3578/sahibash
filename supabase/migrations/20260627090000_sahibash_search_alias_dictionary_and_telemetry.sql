begin;

create table if not exists public.search_alias_dictionary (
  id uuid primary key default gen_random_uuid(),
  canonical_term text not null,
  aliases text[] not null default '{}',
  language text not null check (language in ('en', 'fa', 'ps', 'multi')),
  category_scope text null,
  is_active boolean not null default true,
  approved_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_search_alias_dictionary_unique_scope
  on public.search_alias_dictionary (lower(canonical_term), language, coalesce(category_scope, '*'));

create index if not exists idx_search_alias_dictionary_active
  on public.search_alias_dictionary (is_active, language, updated_at desc);

drop trigger if exists trg_search_alias_dictionary_updated_at on public.search_alias_dictionary;
create trigger trg_search_alias_dictionary_updated_at
before update on public.search_alias_dictionary
for each row execute function public.set_updated_at();

create table if not exists public.search_telemetry (
  id uuid primary key default gen_random_uuid(),
  query_text text not null,
  normalized_query text not null,
  selected_language text not null,
  result_count integer not null default 0,
  clicked_listing_id uuid null references public.listings(id) on delete set null,
  category_filter text null,
  province_filter text null,
  district_filter text null,
  rewritten_terms text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_search_telemetry_created_at
  on public.search_telemetry (created_at desc);

create index if not exists idx_search_telemetry_zero_result
  on public.search_telemetry (result_count, created_at desc)
  where result_count = 0;

create index if not exists idx_search_telemetry_language
  on public.search_telemetry (selected_language, created_at desc);

create index if not exists idx_search_telemetry_query
  on public.search_telemetry (normalized_query);

create index if not exists idx_search_telemetry_rewritten_terms
  on public.search_telemetry using gin (rewritten_terms);

alter table public.search_alias_dictionary enable row level security;
alter table public.search_telemetry enable row level security;

drop policy if exists "Public read active search aliases" on public.search_alias_dictionary;
create policy "Public read active search aliases"
on public.search_alias_dictionary
for select
using (is_active = true);

drop policy if exists "Admins manage search aliases" on public.search_alias_dictionary;
create policy "Admins manage search aliases"
on public.search_alias_dictionary
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Public insert search telemetry" on public.search_telemetry;
create policy "Public insert search telemetry"
on public.search_telemetry
for insert
with check (true);

drop policy if exists "Public update search telemetry clicks" on public.search_telemetry;
create policy "Public update search telemetry clicks"
on public.search_telemetry
for update
using (true)
with check (true);

drop policy if exists "Admins read search telemetry" on public.search_telemetry;
create policy "Admins read search telemetry"
on public.search_telemetry
for select
using (public.is_admin(auth.uid()));

insert into public.search_alias_dictionary (canonical_term, aliases, language, category_scope, is_active)
values
  ('iphone', array['آیفون', 'ایفون', 'i phone'], 'multi', null, true),
  ('samsung', array['سامسونگ', 'سامسنگ'], 'multi', null, true),
  ('phone', array['mobile', 'موبایل', 'مبایل', 'گوشی', 'تلیفون', 'ټیلیفون'], 'multi', null, true),
  ('negotiable', array['جور آمد', 'جورامد', 'قابل جور آمد'], 'multi', null, true),
  ('exchange', array['مالچه', 'بدل', 'تبادله'], 'multi', null, true)
on conflict do nothing;

commit;
