create index if not exists idx_listing_risk_signals_reviewed_by
  on public.listing_risk_signals (reviewed_by)
  where reviewed_by is not null;
