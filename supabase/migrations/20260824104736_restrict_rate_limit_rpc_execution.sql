-- Restrict durable app rate-limit RPC to server-side service-role execution.
-- The application calls this from server actions/API routes through the server-only
-- Supabase admin client; anon/authenticated clients should not execute this
-- SECURITY DEFINER function directly through PostgREST.

revoke all on function public.consume_app_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_app_rate_limit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_app_rate_limit(text, text, integer, integer) to service_role;
