# Sahibash Location System

A professional, privacy-respecting location system for Afghanistan's marketplace.

## Overview

The location system provides:
- **Structured location hierarchy**: Country → Province → District → Area (Neighborhood)
- **Privacy controls**: Sellers choose how much location detail buyers see (exact, approximate, or hidden)
- **Multiple input methods**: 
  - Browser geolocation detection
  - Manual province/district/area selection
  - Map pin coordinate entry
- **Buyer features**:
  - Location cards on listing details
  - Search/filter by province, district, area
  - Distance-based search (near me)
  - Distance badges on search results

## Database Schema

### Location Tables

#### Countries
```sql
countries (id, name, slug, iso_code, sort_order, is_active)
```

#### Provinces
```sql
provinces (id, country_id, name, slug, sort_order, is_active)
```

#### Districts
```sql
districts (id, province_id, name, slug, sort_order, is_active)
```

#### Areas (Neighborhoods)
```sql
areas (id, district_id, name, slug, sort_order, is_active)
```

### Listing Location Fields

Added to the `listings` table:
```
country_id            - Reference to countries table
province_id           - Reference to provinces table
district_id           - Reference to districts table
area_id               - Reference to areas table (nullable)
address_text          - Free text address (nullable)
latitude              - Geographic coordinate
longitude             - Geographic coordinate
location_accuracy     - Accuracy radius in meters (nullable)
location_source       - How location was obtained: manual|browser|gps|map_pin
location_visibility   - Privacy level: exact|approximate|hidden
```

## React Components

### 1. LocationSelector
Manual location selection with cascading dropdowns.

```tsx
import LocationSelector from '@/components/location/LocationSelector';

<LocationSelector
  onLocationSelect={(location) => console.log(location)}
  initialProvince={provinceId}
  initialDistrict={districtId}
/>
```

**Features:**
- Dropdown cascading (province → district → area)
- Optional area and address fields
- Live summary display

### 2. LocationGeolocation
Browser/device geolocation detection.

```tsx
import LocationGeolocation from '@/components/location/LocationGeolocation';

<LocationGeolocation
  onLocationDetected={(location) => console.log(location)}
  onError={(error) => console.error(error)}
/>
```

**Features:**
- Browser Geolocation API integration
- Permission handling
- Error messages
- Fallback to manual selection

### 3. LocationMapPicker
Coordinate entry (Leaflet support ready).

```tsx
import LocationMapPicker from '@/components/location/LocationMapPicker';

<LocationMapPicker
  onLocationSelected={(location) => console.log(location)}
  initialLocation={{ latitude: 34.52, longitude: 69.18 }}
/>
```

**Features:**
- Manual coordinate entry
- Accuracy specification
- Example coordinates for Afghanistan

### 4. LocationPrivacy
Privacy setting selection.

```tsx
import LocationPrivacy from '@/components/location/LocationPrivacy';

<LocationPrivacy
  initialVisibility="approximate"
  defaultByCategory="vehicles"
  categoryName="Vehicles"
  onVisibilityChange={(visibility) => console.log(visibility)}
/>
```

**Privacy Levels:**
- `exact`: Show exact map pin and coordinates to buyers
- `approximate`: Show area only, randomize coordinates by ~1km
- `hidden`: Show province/district only, no coordinates

### 5. LocationStep
Complete location selection workflow wrapper.

```tsx
import LocationStep from '@/components/location/LocationStep';

<LocationStep
  onComplete={(location) => saveLocation(location)}
  categoryName="Vehicles"
/>
```

### 6. LocationCard
Buyer-facing location display card.

```tsx
import LocationCard from '@/components/location/LocationCard';

<LocationCard
  location={{
    provinceName: "Kabul",
    districtName: "Kabul City",
    areaName: "Karte 4",
    addressText: "House 123, Lane 5",
    latitude: 34.520,
    longitude: 69.180,
    visibility: "exact"
  }}
  buyerDistance={2.4}
/>
```

## Server Actions

### saveListingLocation
Save location data to a listing.

```tsx
import { saveListingLocation } from '@/lib/actions/location';

await saveListingLocation(listingId, {
  countryId: 1,
  provinceId: 2,
  districtId: 15,
  areaId: 42,
  addressText: "House 123",
  latitude: 34.52,
  longitude: 69.18,
  accuracy: 50,
  locationSource: 'browser',
  visibility: 'approximate'
});
```

### getNearbyListings
Get listings near a specific location with distance calculation.

```tsx
import { getNearbyListings } from '@/lib/actions/location';

const { listings, count } = await getNearbyListings(
  latitude,
  longitude,
  radiusKm = 10,
  { categoryId: 5, limit: 50 }
);
```

### getListingsByLocation
Get listings filtered by geographic hierarchy.

```tsx
import { getListingsByLocation } from '@/lib/actions/location';

const { listings, count } = await getListingsByLocation({
  provinceId: 2,
  districtId: 15,
  limit: 20,
  offset: 0
});
```

### getListingLocationInfo
Get location info for a listing (respects privacy settings).

```tsx
import { getListingLocationInfo } from '@/lib/actions/location';

const locationInfo = await getListingLocationInfo(listingId);
// Returns: { provinceName, districtName, areaName, latitude, longitude, visibility }
// Coordinates are null or approximated based on visibility setting
```

## Database RPCs

### get_nearby_listings(buyer_lat, buyer_lng, radius_km, status, category_id, limit)

Efficient distance search using Haversine formula.

```sql
select * from get_nearby_listings(
  buyer_latitude := 34.52,
  buyer_longitude := 69.18,
  radius_km := 10,
  listing_status := 'approved',
  limit_count := 50
);
```

### get_listings_by_location(province_id, district_id, area_id, category_id, limit, offset)

Filter listings by location hierarchy with optional distance calculation.

```sql
select * from get_listings_by_location(
  province_filter_id := 2,
  district_filter_id := 15,
  buyer_latitude := 34.52,
  buyer_longitude := 69.18
);
```

## Privacy Behavior

### Seller Perspective

1. **Before publishing**: Seller chooses visibility level
   - Real Estate: Default = `exact`
   - Vehicles: Default = `approximate`
   - Other categories: Default = `approximate`

2. **Seller can always change** before publishing

### Buyer Perspective

#### If visibility = exact
- Sees exact map pin
- Sees full address
- Can get directions
- Sees distance (if buyer location available)

#### If visibility = approximate
- Sees province, district, area
- Sees approximate circle (not exact pin)
- Coordinates randomized within ~1km radius
- Cannot get turn-by-turn directions
- Cannot see exact distance

#### If visibility = hidden
- Sees province and district only
- No map shown
- No coordinates shown
- No address shown
- Cannot see distance

## Default Privacy by Category

```typescript
const DEFAULT_PRIVACY_BY_CATEGORY: Record<string, LocationVisibility> = {
  'Real Estate': 'exact',
  'Vehicles': 'approximate',
  'Phones & Tablets': 'approximate',
  'Electronics': 'approximate',
  'Jobs': 'approximate',
  'Services': 'approximate',
  'Education': 'approximate',
  'Home & Garden': 'approximate',
  'Fashion': 'approximate',
  'Animals': 'approximate',
  'Business & Industry': 'approximate',
};
```

## Data Security

- **RLS Policies**: 
  - Location tables: Public read-only (except admin write)
  - Listings: Existing RLS respected + location visibility enforcement in app logic
  
- **Coordinate Hiding**:
  - Approximate visibility: Randomized coordinates generated server-side
  - Hidden visibility: No coordinates returned to frontend

- **Index Performance**:
  - Indexes on: country_id, province_id, district_id, area_id
  - Haversine index for coordinate distance searches

## Afghanistan Data

**Provinces (34):** Kabul, Herat, Kandahar, Balkh, Nangarhar, Kunduz, Baghlan, Takhar, Badakhshan, Samangan, Sar-e Pol, Faryab, Jawzjan, Bamyan, Daikundi, Ghor, Farah, Helmand, Nimroz, Uruzgan, Zabul, Paktia, Paktika, Khost, Logar, Wardak, Parwan, Kapisa, Panjshir, Nuristan, Kunar, Laghman, Ghazni, Badghis

**Seeded Districts:** Major cities including Kabul, Herat, Jalalabad, Mazar-i-Sharif, Kandahar City, etc.

**Seeded Areas:** Kabul neighborhoods (Karte 1-5, Wazir Akbar Khan, Shahr-e Naw, Taimani, etc.)

## Integration with Post-Ad Flow

The location system integrates into the posting flow with a dedicated location step:

1. Buyer chooses location method (geolocation, manual, map)
2. System fills in location data
3. Buyer reviews and adjusts if needed
4. Buyer selects privacy level before publishing

*(Integration into post-ad-form.tsx pending)*

## Search & Filter Features

*(Ready to integrate into search page)*

- Filter by province, district, area
- "Near Me" search with buyer location permission
- Distance radius options (1, 5, 10, 25, 50, 100 km)
- Sort by: newest, price, distance
- Distance badges on result cards

## Future Enhancements

- **Real Estate Features:**
  - Nearby schools, hospitals, markets
  - Street view alternative
  - 360° neighborhood photos
  - Virtual tours
  - Route planning

- **Map Integration:**
  - Leaflet/OpenStreetMap (recommended)
  - Optional Google Maps/Apple Maps integration
  - Drawing custom areas on map

- **Mobile Optimization:**
  - Touch-friendly controls
  - Optimized for small screens
  - Works offline

## Type Definitions

```typescript
type LocationVisibility = 'exact' | 'approximate' | 'hidden';
type LocationSource = 'manual' | 'browser' | 'gps' | 'map_pin';

interface ListingLocation {
  countryId: number;
  provinceId: number;
  districtId: number;
  areaId?: number;
  provinceName: string;
  districtName: string;
  areaName?: string;
  addressText?: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  visibility: LocationVisibility;
}
```

## Troubleshooting

**Geolocation returns null coordinates:**
- Browser permission denied
- User not on HTTPS (localhost OK for testing)
- Device has no GPS/location service

→ System automatically falls back to manual selection

**Approximate coordinates don't change:**
- Randomization is deterministic per listing (not per load)
- Coordinates stay consistent for same listing+buyer

**Distance search returns no results:**
- Buyer coordinates not provided or invalid
- No listings within radius have coordinates
- All nearby listings have hidden visibility

**Location card not showing:**
- Listing has no province_id/district_id
- All location data is null

→ Card only renders if both province and district exist

## Migration Files

- `20260623010000_sahibash_location_system.sql` - Schema
- `20260623020000_sahibash_location_afghanistan_seed.sql` - Data
- `20260623030000_sahibash_location_rpcs.sql` - Distance search RPCs
