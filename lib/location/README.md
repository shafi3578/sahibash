# Sahibash Afghanistan Location System - Quick Start

## Overview

A complete, production-ready location selection system for Afghanistan with:
- ✅ 34 provinces, ~398 districts
- ✅ Multilingual support (English, Dari, Pashto)
- ✅ Progressive lazy-loading (Province → District → Area)
- ✅ Custom area submission with admin approval
- ✅ Split components (not monolithic)
- ✅ Full validation and search

## Installation & Setup

### 1. Run Database Migration

```bash
# Apply the schema
psql -U postgres -d sahibash -f supabase/migrations/002_location_system.sql
```

### 2. Import Seed Data

```bash
# Import all provinces and districts
psql -U postgres -d sahibash -f supabase/seeds/001_provinces.sql
psql -U postgres -d sahibash -f supabase/seeds/002_districts_north.sql
psql -U postgres -d sahibash -f supabase/seeds/003_districts_east_central.sql
# ... import other region files as needed
```

### 3. Import in Next.js

Update your app to use the new location system:

```tsx
'use client';

import { LocationSelector } from '@/components/location/LocationSelectorV2';
import type { LocationSelection } from '@/lib/location/types';
import { useState } from 'react';

export function PostingForm() {
  const [location, setLocation] = useState<LocationSelection | null>(null);

  return (
    <div className="space-y-4">
      <LocationSelector
        onLocationChange={setLocation}
        locale="en"  // or 'fa', 'ps'
        required={true}
        showErrors={true}
      />
      
      {location && (
        <div className="p-4 bg-green-50 rounded">
          <p>Province ID: {location.province_id}</p>
          <p>District ID: {location.district_id}</p>
          {location.area_custom && <p>Custom Area: {location.area_custom}</p>}
        </div>
      )}
    </div>
  );
}
```

## Component Architecture

```
LocationSelectorV2
├── ProvinceSelector        (Browse/search provinces)
├── DistrictSelector        (Lazy-load districts after province)
└── AreaSelector            (Lazy-load areas + custom input)
```

**Why split components?**
- Easier to test and maintain
- Each component has single responsibility
- Reusable in different contexts
- Clear data flow and props

## Data Flow

```
User Selects Province
  ↓
ProvinceSelector emits selection
  ↓
useDistricts(provinceId) hook fetches districts
  ↓
DistrictSelector displays districts
  ↓
User Selects District
  ↓
useAreas(provinceId, districtId) hook fetches areas
  ↓
AreaSelector displays areas + custom input
  ↓
User can select area or submit custom name
  ↓
LocationSelector validates and emits LocationSelection
```

## Key Features

### 1. Multilingual Names

Every province, district, and area has names in:
- English (name_en)
- Dari (name_fa)
- Pashto (name_ps)

```typescript
import { getLocalizedName } from '@/lib/location/utils';

const name = getLocalizedName(province, 'fa'); // Returns Dari name
```

### 2. Search with Aliases

Search works across all languages and alias names:

```typescript
import { searchProvinces } from '@/lib/location/utils';

// Searches name_en, name_fa, name_ps, and aliases array
const results = searchProvinces(provinces, 'kabul', 'en');
```

### 3. Custom Area Submission

Users can submit areas that don't exist yet:

```typescript
// User types "My Neighborhood"
// System submits for admin approval
// User sees "pending approval" status
// Admin can approve, edit, or merge later
```

### 4. Progressive Loading

Districts only load after province selection:
- Faster initial load
- Smaller API responses
- Better UX with clear progression

### 5. Validation

```typescript
import { validateLocation } from '@/lib/location/utils';

// Province: required
// District: required  
// Area: optional

const errors = validateLocation(provinceId, districtId);
// Returns: { province?: string, district?: string }
```

## API Endpoints

All endpoints are REST-based with JSON responses.

### GET /api/location/provinces

Returns all active provinces.

```bash
curl http://localhost:3000/api/location/provinces
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "abc-123",
      "slug": "kabul",
      "name_en": "Kabul",
      "name_fa": "کابل",
      "name_ps": "کابل",
      "aliases": ["Kabul City"],
      "sort_order": 1,
      "is_active": true
    },
    // ... more provinces
  ]
}
```

### GET /api/location/districts?province_id=<id>

Returns districts for a province (lazy-loaded).

```bash
curl "http://localhost:3000/api/location/districts?province_id=abc-123"
```

### GET /api/location/areas?province_id=<id>&district_id=<id>

Returns areas for a location.

```bash
curl "http://localhost:3000/api/location/areas?province_id=abc-123&district_id=def-456"
```

### POST /api/location/areas

Submit a custom area for admin approval.

```bash
curl -X POST http://localhost:3000/api/location/areas \
  -H "Content-Type: application/json" \
  -d '{
    "province_id": "abc-123",
    "district_id": "def-456",
    "name_en": "My Area",
    "name_fa": "منطقه من",
    "name_ps": "سیمه من",
    "user_id": "user-123"
  }'
```

## React Hooks

### useProvinces()

Load all provinces once on mount.

```typescript
const { provinces, loading, error } = useProvinces();

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
if (provinces.length === 0) return <div>No provinces</div>;
```

### useDistricts(provinceId)

Load districts when province is selected (lazy).

```typescript
const { districts, loading, error } = useDistricts(selectedProvinceId);

// Only loads when selectedProvinceId is provided
// Empty array if no provinceId
```

### useAreas(provinceId, districtId, popularOnly?)

Load areas for a location.

```typescript
const { areas, loading, error } = useAreas(
  selectedProvinceId,
  selectedDistrictId,
  false // optional: show only popular areas
);
```

### useSubmitCustomArea()

Submit a custom area.

```typescript
const { submit, submitting, error } = useSubmitCustomArea();

await submit(
  provinceId,
  nameEn,
  nameFa,
  namePs,
  districtId,  // optional
  userId       // optional
);
```

## Database Views (Future)

For admin dashboard:

```sql
-- Top submitted areas waiting approval
SELECT name_en, submitted_at, submitted_by_user_id
FROM areas
WHERE is_approved = false
ORDER BY submitted_at DESC;

-- Popular areas by province
SELECT province_id, name_en, COUNT(*) as listings
FROM areas a
JOIN listings l ON a.id = l.area_id
WHERE a.is_popular = true
GROUP BY province_id, name_en;
```

## Testing Checklist

- [ ] Load provinces (should show all 34)
- [ ] Search provinces by English/Dari/Pashto
- [ ] Select province, verify districts load
- [ ] Search districts
- [ ] Select district, verify areas load
- [ ] Enter custom area, verify "Add" button
- [ ] Submit custom area, see "pending approval"
- [ ] Validation: select province only → should show error for district
- [ ] Validation: select province + district → should be valid
- [ ] Change language, verify names update
- [ ] Test on mobile (responsive grid)
- [ ] Test on 3G/slow network (loading states)

## Admin Features (Coming)

- Dashboard to approve/reject custom areas
- Bulk edit areas (name, aliases, popularity)
- Merge duplicate areas
- Analytics on area usage
- Trending neighborhoods by region

## File Locations

```
lib/location/
├── types.ts          # TypeScript definitions
├── utils.ts          # Helpers (search, validate, format)
└── hooks.ts          # React hooks for data fetching

components/location/
├── ProvinceSelector.tsx
├── DistrictSelector.tsx
├── AreaSelector.tsx
└── LocationSelectorV2.tsx

app/api/location/
├── provinces/route.ts
├── districts/route.ts
└── areas/route.ts

supabase/
├── migrations/002_location_system.sql
└── seeds/
    ├── 001_provinces.sql
    ├── 002_districts_north.sql
    └── ... more files
```

## Troubleshooting

**Q: Districts not showing**
A: Make sure you selected a province first. Check database has districts for that province.

**Q: Custom area not saving**
A: Check `api/location/areas` POST route is working. Verify user_id is being sent.

**Q: Search not working**
A: Names must be in correct language columns (name_en, name_fa, name_ps). Check aliases array.

**Q: Slow performance**
A: Check database has proper indexes. Use `EXPLAIN ANALYZE` on slow queries.

## Performance Tips

1. **Caching**: Provinces loaded once on mount, reused
2. **Lazy Loading**: Districts/areas only load when needed
3. **Search**: Client-side for loaded data, not server-side
4. **Indexes**: Database indexes on province_id, district_id, is_active
5. **Pagination**: Not needed - full lists are small enough

## Integration Tips

### With Posting Form

```typescript
// Step 1: Ad Details
// Step 2: Category
// Step 3: Location (NEW - use LocationSelector)
// Step 4: Photos
// Step 5: Review & Publish
```

### With Admin Dashboard

```typescript
// Admin > Settings > Locations
// - Approve custom areas
// - Edit area details
// - Merge duplicates
// - Set popularity
// - View analytics
```

### With Listing Display

```typescript
// Show public location (never full GPS by default)
// "Kabul > District 1" 
// Show area only if user provided it

function displayPublicLocation(listing) {
  return `${listing.province_name} > ${listing.district_name}`;
}
```

## Support

For issues or questions:
1. Check `docs/LOCATION_SYSTEM_V2.md` for detailed documentation
2. Review component props in TypeScript files
3. Check API route implementations
4. Run test queries directly on database

## License

Part of Sahibash marketplace platform.
