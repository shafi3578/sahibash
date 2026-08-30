begin;

-- Keep database-side matching in parity with lib/search/multilingual.ts so
-- common Dari/Pashto orthographic variants share one indexed representation.
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
          replace(
            replace(
              replace(
                replace(
                  replace(
                    replace(
                      translate(
                        lower(coalesce(input, '')),
                        '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩يىئكةۀأإٱآؤ',
                        '01234567890123456789یییکههااااو'
                      ),
                      'ـ',
                      ''
                    ),
                    chr(8204),
                    ''
                  ),
                  chr(8205),
                  ''
                ),
                chr(8206),
                ''
              ),
              chr(8207),
              ''
            ),
            chr(65279),
            ''
          ),
          '[ً-ٰٟۖ-ۭ]',
          '',
          'g'
        ),
        '[[:punct:]]+',
        ' ',
        'g'
      ),
      '\s+',
      ' ',
      'g'
    )
  );
$$;

-- Stored generated values are not retroactively recalculated when an
-- immutable function body changes. Rebuild only the derived search columns;
-- no listing or translation source data is deleted or rewritten.
drop index if exists public.idx_listings_search_document_gin;
drop index if exists public.idx_listings_search_normalized_trgm;

alter table public.listings
  drop column if exists search_document,
  drop column if exists search_normalized;

alter table public.listings
  add column search_normalized text generated always as (
    public.normalize_search_text_sql(
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(vehicle_brand, '') || ' ' ||
      coalesce(vehicle_model, '') || ' ' ||
      coalesce(province, '') || ' ' ||
      coalesce(district, '')
    )
  ) stored,
  add column search_document tsvector generated always as (
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
  ) stored;

create index idx_listings_search_document_gin
  on public.listings using gin (search_document)
  where status = 'approved';

create index idx_listings_search_normalized_trgm
  on public.listings using gin (search_normalized extensions.gin_trgm_ops)
  where status = 'approved';

alter table public.listing_translations
  add column if not exists search_normalized text generated always as (
    public.normalize_search_text_sql(
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(normalized_keywords, '')
    )
  ) stored;

create index if not exists idx_listing_translations_search_normalized_trgm
  on public.listing_translations using gin (search_normalized extensions.gin_trgm_ops)
  where translation_status = 'completed';

-- These generated values contain only already-public listing/translation
-- text. RLS continues to decide which rows each role may read.
grant select (search_normalized) on public.listings to anon, authenticated;
grant select (search_normalized) on public.listing_translations to anon, authenticated;

comment on function public.normalize_search_text_sql(text)
  is 'Canonical multilingual search normalization kept in parity with the Sahibash application normalizer.';
comment on column public.listings.search_normalized
  is 'Public-field-only normalized listing text used for indexed multilingual substring search; row access remains protected by RLS.';
comment on column public.listing_translations.search_normalized
  is 'Normalized public translation text used for indexed multilingual substring search; row access remains protected by RLS.';

do $$
begin
  if public.normalize_search_text_sql('اکوا') <> public.normalize_search_text_sql('آکوا') then
    raise exception 'Multilingual search normalization parity failed for اکوا/آکوا';
  end if;

  if public.normalize_search_text_sql('كابل') <> public.normalize_search_text_sql('کابل') then
    raise exception 'Multilingual search normalization parity failed for Arabic/Persian kaf';
  end if;

  if public.normalize_search_text_sql('موبايل') <> public.normalize_search_text_sql('موبایل') then
    raise exception 'Multilingual search normalization parity failed for Arabic/Persian yeh';
  end if;
end;
$$;

commit;
