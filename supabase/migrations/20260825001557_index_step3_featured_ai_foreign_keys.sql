-- Step 3 performance follow-up applied to the linked Supabase project as
-- migration 20260825001557. These indexes cover foreign keys introduced by the
-- featured-payment and AI telemetry foundation so Advisor does not report new
-- Step 3 unindexed-FK warnings.

create index if not exists idx_promotion_campaign_configs_updated_by
  on public.promotion_campaign_configs(updated_by)
  where updated_by is not null;

create index if not exists idx_promotion_payment_requests_campaign_config
  on public.promotion_payment_requests(campaign_config_id);

create index if not exists idx_ai_search_parse_events_actor_user_id
  on public.ai_search_parse_events(actor_user_id, created_at desc)
  where actor_user_id is not null;

create index if not exists idx_ai_moderation_reviews_ai_detection_log_id
  on public.ai_moderation_reviews(ai_detection_log_id)
  where ai_detection_log_id is not null;

create index if not exists idx_ai_moderation_reviews_reviewed_by
  on public.ai_moderation_reviews(reviewed_by, reviewed_at desc)
  where reviewed_by is not null;
