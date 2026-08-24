# Sahibash Location Privacy Model

Date: 2026-08-24
Status: app-side public sanitization hardened; full API/RLS integration tests remain.

## Visibility levels

Sahibash supports these public location visibility levels:

| Level | Public behavior |
| --- | --- |
| `hidden` | No address text and no coordinates returned to public helpers. |
| `province_district` | Province/district display only; no address text or coordinates. |
| `approximate` | Coarse deterministic coordinate grid; no exact address text. |
| `exact` | Exact seller-selected coordinate/address may be displayed. |

Private sellers should default to `province_district` or `approximate`. Exact map display should be deliberate.

## Fix implemented

File: `lib/location/privacy.ts`

`sanitizePublicLocation()` now centralizes public location output rules.

Important change:

- Removed random coordinate offsets from public approximate location helpers.
- Random offsets can be requested repeatedly and averaged back toward the original point.
- Approximate locations now use deterministic coarse rounding to about a 1km grid.

Updated helper:

- `lib/actions/location.ts`

Tests:

- `tests/location-privacy.test.ts`

## Listing detail page

The public listing detail page passes exact latitude/longitude to `LocationCard` only when `location_visibility === "exact"`.

For hidden/province-district:

- no coordinates;
- no street address.

For approximate:

- helper layer returns coarse coordinates only;
- no exact address text.

## Remaining work

P0/P1:

- Add staging RLS/API tests proving anonymous users cannot query exact coordinates for hidden/province-district listings through any exposed route.
- Review all future API routes that select `latitude`, `longitude`, or `address_text` and require `sanitizePublicLocation()` for public responses.

P2:

- Implement PostGIS-backed radius search using sanitized public coordinates for public display, while keeping exact seller coordinates protected.
- Add browser/mobile QA for maps and directions in English, Dari and Pashto.
