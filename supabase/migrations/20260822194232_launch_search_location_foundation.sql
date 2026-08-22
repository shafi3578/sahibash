begin;

-- Launch search/location foundation.
-- Additive only: no existing data is deleted or rewritten destructively.
-- Supabase changelog note: do not pin extension versions; install default versions.

create extension if not exists pg_trgm with schema extensions;
create extension if not exists postgis with schema extensions;

create or replace function public.normalize_search_text_sql(input text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select btrim(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
          replace(replace(replace(replace(replace(replace(replace(replace(replace(replace(
          replace(replace(replace(replace(lower(coalesce(input, '')),
            '۰','0'),'۱','1'),'۲','2'),'۳','3'),'۴','4'),'۵','5'),'۶','6'),'۷','7'),'۸','8'),'۹','9'),
            '٠','0'),'١','1'),'٢','2'),'٣','3'),'٤','4'),'٥','5'),'٦','6'),'٧','7'),'٨','8'),'٩','9'),
            'ي','ی'),'ى','ی'),'ك','ک'),'ـ',''),
          '[ًٌٍَُِّْٰ]', '', 'g'
        ),
        '[[:punct:]]+', ' ', 'g'
      ),
      '\s+', ' ', 'g'
    )
  );
$$;

alter table public.listings
  add column if not exists search_normalized text generated always as (
    public.normalize_search_text_sql(
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(vehicle_brand, '') || ' ' ||
      coalesce(vehicle_model, '') || ' ' ||
      coalesce(province, '') || ' ' ||
      coalesce(district, '')
    )
  ) stored,
  add column if not exists search_document tsvector generated always as (
    to_tsvector(
      'simple',
      public.normalize_search_text_sql(
        coalesce(title, '') || ' ' ||
        coalesce(description, '') || ' ' ||
        coalesce(vehicle_brand, '') || ' ' ||
        coalesce(vehicle_model, '') || ' ' ||
        coalesce(province, '') || ' ' ||
        coalesce(district, '')
      )
    )
  ) stored,
  add column if not exists location_geog extensions.geography(Point, 4326) generated always as (
    case
      when latitude is not null
        and longitude is not null
        and latitude between -90 and 90
        and longitude between -180 and 180
      then extensions.ST_SetSRID(extensions.ST_MakePoint(longitude::double precision, latitude::double precision), 4326)::extensions.geography
      else null
    end
  ) stored;

create index if not exists idx_listings_public_feed_keyset
  on public.listings (status, created_at desc, id desc)
  where status = 'approved';

create index if not exists idx_listings_public_category_price
  on public.listings (category_id, status, price, created_at desc)
  where status = 'approved';

create index if not exists idx_listings_public_location_status
  on public.listings (province_id, district_id, status, created_at desc)
  where status = 'approved';

create index if not exists idx_listings_public_vehicle_exact
  on public.listings (status, vehicle_brand, vehicle_model, vehicle_year)
  where status = 'approved';

create index if not exists idx_listings_search_document_gin
  on public.listings using gin (search_document)
  where status = 'approved';

create index if not exists idx_listings_search_normalized_trgm
  on public.listings using gin (search_normalized extensions.gin_trgm_ops)
  where status = 'approved';

create index if not exists idx_listings_location_geog_gist
  on public.listings using gist (location_geog)
  where status = 'approved' and location_geog is not null;

create index if not exists idx_search_alias_dictionary_aliases_gin
  on public.search_alias_dictionary using gin (aliases);

create index if not exists idx_search_alias_dictionary_canonical_trgm
  on public.search_alias_dictionary using gin (canonical_term extensions.gin_trgm_ops)
  where is_active = true;

insert into public.search_alias_dictionary (canonical_term, aliases, language, category_scope, is_active)
values
  ('Toyota Corolla', array['Corolla', 'Corola', 'کرولا', 'کورولا', 'تویوتا کرولا', 'Toyota Corola'], 'multi', 'vehicles', true),
  ('Toyota Fielder', array['Fielder', 'Fildr', 'Filder', 'فیلدر', 'فیلډر', 'فلدر'], 'multi', 'vehicles', true),
  ('Toyota Hilux', array['Hilux', 'Hilex', 'هایلکس', 'هیلکس', 'هیلکسل'], 'multi', 'vehicles', true),
  ('Toyota Camry', array['Camry', 'کمری', 'کامری'], 'multi', 'vehicles', true),
  ('Honda Civic', array['Civic', 'سیویک', 'سيويک'], 'multi', 'vehicles', true),
  ('iPhone 13', array['iphone13', 'i phone 13', 'آیفون ۱۳', 'ایفون ۱۳', 'ایفون 13'], 'multi', 'mobile-phones-tablets', true),
  ('iPhone 14', array['iphone14', 'i phone 14', 'آیفون ۱۴', 'ایفون ۱۴', 'ایفون 14'], 'multi', 'mobile-phones-tablets', true),
  ('Samsung Galaxy', array['Galaxy', 'گلکسی', 'گلاکسی', 'سامسونگ گلکسی', 'سامسنګ ګلکسي'], 'multi', 'mobile-phones-tablets', true),
  ('Kabul', array['کابل', 'kaboul'], 'multi', null, true),
  ('Herat', array['هرات'], 'multi', null, true),
  ('Mazar-e-Sharif', array['Mazar', 'Mazar Sharif', 'مزار', 'مزار شریف'], 'multi', null, true),
  ('Jalalabad', array['جلال آباد', 'جلال اباد', 'ننگرهار', 'ننګرهار'], 'multi', null, true),
  ('Kandahar', array['قندهار', 'کندهار'], 'multi', null, true)
on conflict do nothing;

comment on function public.normalize_search_text_sql(text)
  is 'Database-side lightweight search normalization for Sahibash FTS/trigram indexes; app-level normalization remains the richer source for query rewriting.';

comment on column public.listings.location_geog
  is 'Generated PostGIS geography point from seller latitude/longitude for fast radius/nearest search while location_visibility still controls public precision.';

commit;
