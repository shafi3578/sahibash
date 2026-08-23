begin;

alter table public.listing_drafts
  drop constraint if exists listing_drafts_posting_type_check;

alter table public.listing_drafts
  add constraint listing_drafts_posting_type_check
  check (posting_type in ('sell', 'rent', 'wanted', 'telegram', 'quick'));

commit;
