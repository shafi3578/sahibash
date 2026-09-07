begin;

-- Support staff may triage requests, but requester identity and message content
-- remain immutable after the server accepts them.
revoke update on table public.support_requests from authenticated;
grant update (status) on table public.support_requests to authenticated;

commit;
