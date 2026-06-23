# Sahibash V1 Folder Structure

## App Router

- `app/page.tsx` home with search, categories, featured, latest
- `app/listings/page.tsx` listing index
- `app/listings/[id]/page.tsx` listing details + favorite/report actions
- `app/category/[slug]/page.tsx` category archive
- `app/search/page.tsx` search results and filters
- `app/post-ad/page.tsx` create listing form
- `app/login/page.tsx` sign in
- `app/register/page.tsx` sign up
- `app/reset-password/page.tsx` request/update password
- `app/dashboard/page.tsx` user dashboard shell
- `app/dashboard/my-ads/page.tsx` user listing management
- `app/dashboard/favorites/page.tsx` favorite management
- `app/admin/page.tsx` admin stats
- `app/admin/listings/page.tsx` moderation queue
- `app/auth/callback/route.ts` auth callback handling

## Server and Data

- `lib/actions/auth.ts` auth server actions
- `lib/actions/listings.ts` listing CRUD/moderation/image upload actions
- `lib/actions/favorites.ts` favorite toggle action
- `lib/actions/reports.ts` listing report action
- `lib/data/queries.ts` typed Supabase read queries
- `lib/validators/listing.ts` zod schema for listing payloads

## Supabase

- `lib/supabase/server.ts` server client factory
- `lib/supabase/browser.ts` browser client factory
- `lib/supabase/middleware.ts` session refresh helper
- `lib/supabase/admin.ts` service-role admin client factory
- `supabase/schema.sql` full DB schema, storage, indexes, triggers, and RLS policies

## Shared Domain

- `types/database.ts` V1 domain types
- `lib/constants/categories.ts` category config and slug mappings
- `lib/constants/marketplace.ts` city/category option constants
