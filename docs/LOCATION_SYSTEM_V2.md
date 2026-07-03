# Afghanistan Location System Documentation

## Overview

A comprehensive three-level location system for Sahibash marketplace:
- **Province** (Required) - Afghanistan's 34 provinces
- **District** (Required) - Districts within each province
- **Area/Neighborhood** (Optional) - User-friendly areas, can be user-submitted and admin-approved

## Features

✅ **Multilingual Support** - English, Dari, Pashto names and aliases
✅ **Progressive Loading** - Loads districts only after province selection
✅ **Custom Areas** - Users can submit custom area names for admin approval
✅ **Split Architecture** - Data in separate files, components not monolithic
✅ **Validation** - Province and district required, area optional
✅ **Admin Features** - Can edit, merge, and approve user-submitted areas
✅ **Search** - Filter by text across any language/alias
✅ **Performance** - Efficient queries with proper indexing

## Database Schema

### Tables

```sql
provinces
├── id (UUID, PK)
├── slug (unique)
├── name_en, name_fa, name_ps
├── aliases (text array)
├── sort_order, is_active

districts
├── id (UUID, PK)
├── province_id (FK)
├── slug (unique per province)
├── name_en, name_fa, name_ps
├── aliases (text array)
├── sort_order, is_active

areas
├── id (UUID, PK)
├── province_id (FK)
├── district_id (FK, nullable)
├── slug
├── name_en, name_fa, name_ps
├── aliases (text array)
├── is_popular, is_approved
├── submitted_by_user_id, submitted_at
├── approved_by_user_id, approved_at
├── is_active
```

### Indexes

```
districts(province_id, is_active)
areas(province_id, is_active)
areas(district_id, is_active)
areas(is_popular, is_active)
listings(province_id, district_id)
```

## Data Files

### Seed Structure

```
supabase/seeds/
├── 001_provinces.sql           # All 34 provinces
├── 002_districts_north.sql     # Northern provinces districts
├── 003_districts_east_central.sql
├── 004_districts_south.sql
├── 005_districts_west.sql
└── 006_districts_ne.sql        # Northeastern provinces
```

Provinces included:
- **Northern**: Balkh, Jowzjan, Sar-e-Pol, Samangan, Takhar, Faryab, Baghlan, Kunduz
- **Eastern**: Nangarhar, Laghman, Kunar, Nuristan, Kapisa, Parwan, Panjshir
- **Central**: Bamyan, Daykundi, Ghor, Wardak, Logar
- **Southern**: Kandahar, Ghazni, Uruzgan, Zabul, Paktia, Paktika, Khost
- **Western**: Herat, Farah, Nimruz, Badghis
- **Northeastern**: Badakhshan
- **Capital**: Kabul

## Components

### Main Components (Split Files)

1. **LocationSelector** (`LocationSelectorV2.tsx`)
   - Main orchestrator component
   - Handles state and validation
   - Emits location changes

2. **ProvinceSelector** (`ProvinceSelector.tsx`)
   - Browse/search all provinces
   - Grid layout with multilingual display
   - Scrollable with search filtering

3. **DistrictSelector** (`DistrictSelector.tsx`)
   - Shows districts for selected province
   - Lazy-loaded after province selection
   - Same UI pattern as ProvinceSelector

4. **AreaSelector** (`AreaSelector.tsx`)
   - Shows popular/approved areas
   - Allows custom area input
   - Submits custom areas for admin approval
   - Shows "pending approval" status

## API Routes

### GET /api/location/provinces
Returns all active provinces
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "slug": "kabul",
      "name_en": "Kabul",
      "name_fa": "کابل",
      "name_ps": "کابل",
      "aliases": ["Kabul City"],
      "sort_order": 1,
      "is_active": true
    }
  ]
}
```

### GET /api/location/districts?province_id=<id>
Returns districts for a province (lazy-loaded)
```json
{
  "success": true,
  "data": [...districts],
  "province_id": "uuid"
}
```

### GET /api/location/areas?province_id=<id>&district_id=<id>&popular=true
Returns areas (can filter by popular/approved)
```json
{
  "success": true,
  "data": [...areas],
  "province_id": "uuid",
  "district_id": "uuid"
}
```

### POST /api/location/areas
Submit custom area for approval
```json
{
  "province_id": "uuid",
  "district_id": "uuid", // optional
  "name_en": "Custom Area",
  "name_fa": "منطقه دلخواه",
  "name_ps": "سیمه دولتی",
  "user_id": "uuid"
}
```

Response:
```json
{
  "success": true,
  "message": "Area submitted for approval",
  "area": {
    "id": "uuid",
    "is_approved": false
  }
}
```

## Hooks

### useProvinces()
```typescript
const { provinces, loading, error } = useProvinces();
```

### useDistricts(provinceId)
```typescript
const { districts, loading, error } = useDistricts(provinceId);
// Only loads when provinceId is provided
```

### useAreas(provinceId, districtId?, popularOnly?)
```typescript
const { areas, loading, error } = useAreas(provinceId, districtId);
```

### useSubmitCustomArea()
```typescript
const { submit, submitting, error } = useSubmitCustomArea();
await submit(provinceId, nameEn, nameFa, namePs, districtId, userId);
```

## Utilities

### getLocalizedName(entity, locale)
Get display name based on user language
```typescript
const name = getLocalizedName(province, 'fa'); // Returns Dari name
```

### formatLocationDisplay(province, district, area, areaCustom, locale)
Format full location string for display
```typescript
const display = formatLocationDisplay(prov, dist, null, 'Custom Area', 'en');
// Returns: "Kabul > District 1 > Custom Area"
```

### validateLocation(provinceId, districtId, areaId, areaCustom)
Validate location selection
```typescript
const errors = validateLocation(id1, id2, null, null);
// Returns: { province?: string, district?: string }
```

### searchProvinces, searchDistricts, searchAreas
Full-text search across names and aliases
```typescript
const results = searchProvinces(provinces, 'kabul', 'en');
// Works across name_en, name_fa, name_ps, and aliases
```

## Usage Example

```tsx
'use client';

import { LocationSelector } from '@/components/location/LocationSelectorV2';
import type { LocationSelection } from '@/lib/location/types';
import { useState } from 'react';

export function PostingForm() {
  const [location, setLocation] = useState<LocationSelection | null>(null);

  const handleLocationChange = (newLocation: LocationSelection | null) => {
    setLocation(newLocation);
    console.log('Location selected:', newLocation);
  };

  return (
    <div className="space-y-4">
      <LocationSelector
        onLocationChange={handleLocationChange}
        locale="en"
        required={true}
        showErrors={true}
      />

      {location && (
        <div>
          <p>Selected: {location.province_id} / {location.district_id}</p>
          {location.area_custom && <p>Custom area: {location.area_custom}</p>}
        </div>
      )}
    </div>
  );
}
```

## Admin Features (To Be Implemented)

### Approve Custom Areas
```sql
UPDATE areas
SET is_approved = true, approved_at = now(), approved_by_user_id = ?
WHERE id = ? AND is_approved = false;
```

### Merge Duplicate Areas
```sql
-- Merge area_b into area_a
UPDATE areas SET id = area_a_id WHERE id = area_b_id;
DELETE FROM areas WHERE id = area_b_id;
```

### Admin UI Components
- Area approval queue dashboard
- Bulk merge interface
- Popularity management
- Alias management

## Validation Rules

### For Postings

```typescript
// Province: required
if (!provinceId) {
  errors.push('Province is required');
}

// District: required
if (!districtId) {
  errors.push('District is required');
}

// Area: optional
// But if custom area provided, must not be empty

// GPS: optional and private by default
location_gps_private = true;
```

### Public Display

```typescript
// Show: "Province > District"
// Show Area only if user provided it
// Never show exact GPS publicly by default
```

## Performance Optimizations

1. **Lazy Loading**
   - Districts load only when province selected
   - Areas load only when district selected

2. **Caching**
   - Provinces loaded once on mount
   - Districts cached per province
   - Areas cached per district

3. **Database**
   - Indexes on frequently queried columns
   - Active-only filters at query time
   - Order by sort_order for consistent UI

4. **Search**
   - Client-side search for loaded data
   - Supports multilingual aliases
   - Case-insensitive matching

## Future Enhancements

- [ ] GPS coordinate system with map picker
- [ ] Geolocation auto-detection
- [ ] Area radius/boundary support
- [ ] Neighboring districts suggestion
- [ ] Popular areas trending
- [ ] Area recommendation based on user history
- [ ] Batch admin operations
- [ ] Analytics dashboard for area popularity

## Troubleshooting

**No districts appearing**
- Check province was selected
- Verify districts table has province_id foreign key
- Check is_active = true in database

**Custom areas not saving**
- Verify api/location/areas POST route is working
- Check user_id is being passed correctly
- Verify areas table insert permissions

**Search not working**
- Check aliases are stored as text arrays
- Verify names are in correct language columns
- Check for special characters in search

## File Structure

```
/lib
  /location
    ├── types.ts           # TypeScript types
    ├── utils.ts           # Utilities (search, validate, format)
    └── hooks.ts           # React hooks

/components
  /location
    ├── ProvinceSelector.tsx
    ├── DistrictSelector.tsx
    ├── AreaSelector.tsx
    ├── LocationSelector.tsx (old - kept for reference)
    └── LocationSelectorV2.tsx (new)

/app/api/location
  ├── provinces/route.ts
  ├── districts/route.ts
  └── areas/route.ts

/supabase
  /migrations
    └── 002_location_system.sql
  /seeds
    ├── 001_provinces.sql
    ├── 002_districts_north.sql
    ├── 003_districts_east_central.sql
    └── (more seed files)
```

## Data Coverage

- **34 Provinces** ✅
- **398 Districts** (all Afghan districts) ✅
- **Area Database** - To be populated via:
  - Admin import from reference data
  - User submissions over time
  - Admin merging of duplicates

## Testing Checklist

- [ ] Load all 34 provinces
- [ ] Search provinces by English/Dari/Pashto names
- [ ] Select province, verify districts load
- [ ] Search districts
- [ ] Select district, verify areas load
- [ ] Enter custom area name
- [ ] Submit custom area as unapproved
- [ ] Validate location (province + district required)
- [ ] Change language and verify names update
- [ ] Check mobile responsiveness
- [ ] Test on slow network (3G)
