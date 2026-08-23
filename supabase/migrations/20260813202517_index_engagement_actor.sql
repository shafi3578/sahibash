create index listing_engagement_events_actor_user_idx
on public.listing_engagement_events(actor_user_id)
where actor_user_id is not null;
