'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type LocationVisibility } from '@/components/location/LocationPrivacy';

/**
 * Save location data to a listing
 */
export async function saveListingLocation(
  listingId: string,
  locationData: {
    countryId?: number;
    provinceId?: number;
    districtId?: number;
    areaId?: number;
    addressText?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    locationSource?: string;
    visibility?: LocationVisibility;
  }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase
    .from('listings')
    .update({
      country_id: locationData.countryId,
      province_id: locationData.provinceId,
      district_id: locationData.districtId,
      area_id: locationData.areaId,
      address_text: locationData.addressText,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      location_accuracy: locationData.accuracy,
      location_source: locationData.locationSource || 'manual',
      location_visibility: locationData.visibility || 'approximate',
      updated_at: new Date().toISOString(),
    })
    .eq('id', listingId);

  if (error) {
    throw new Error(`Failed to save location: ${error.message}`);
  }

  return { success: true };
}

/**
 * Get nearby listings by distance
 */
export async function getNearbyListings(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  filters?: {
    categoryId?: number;
    provinceId?: number;
    status?: string;
    limit?: number;
  }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Using Haversine formula for distance calculation
  // cos(lat1) * cos(lat2) * cos(lon2-lon1) + sin(lat1) * sin(lat2)
  // This is a basic implementation; for production, consider PostGIS

  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      id,
      title,
      price,
      currency,
      latitude,
      longitude,
      location_visibility,
      location_accuracy,
      province_id,
      district_id,
      area_id,
      address_text,
      created_at,
      user_id,
      category_id
      `
    )
    .eq('status', filters?.status || 'approved')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .limit(filters?.limit || 50);

  if (error) {
    throw new Error(`Failed to fetch nearby listings: ${error.message}`);
  }

  if (!data) {
    return { listings: [], count: 0 };
  }

  // Filter by distance using Haversine formula
  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  const R = 6371; // Radius of earth in km

  const filteredListings = data
    .map((listing: any) => {
      const dLat = deg2rad(listing.latitude - latitude);
      const dLon = deg2rad(listing.longitude - longitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(latitude)) *
          Math.cos(deg2rad(listing.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return {
        ...listing,
        distance,
      };
    })
    .filter((listing: any) => listing.distance <= radiusKm)
    .sort((a: any, b: any) => a.distance - b.distance);

  return { listings: filteredListings, count: filteredListings.length };
}

/**
 * Get listings by province/district/area
 */
export async function getListingsByLocation(
  filters: {
    provinceId?: number;
    districtId?: number;
    areaId?: number;
    categoryId?: number;
    limit?: number;
    offset?: number;
  }
) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  let query = supabase
    .from('listings')
    .select(
      `
      id,
      title,
      price,
      currency,
      province_id,
      district_id,
      area_id,
      address_text,
      location_visibility,
      latitude,
      longitude,
      created_at,
      favorites_count,
      views_count
      `,
      { count: 'exact' }
    )
    .eq('status', 'approved');

  if (filters.provinceId) {
    query = query.eq('province_id', filters.provinceId);
  }

  if (filters.districtId) {
    query = query.eq('district_id', filters.districtId);
  }

  if (filters.areaId) {
    query = query.eq('area_id', filters.areaId);
  }

  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 20) - 1);

  if (error) {
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }

  return { listings: data || [], count: count || 0 };
}

/**
 * Get location information for a listing (respecting visibility)
 */
export async function getListingLocationInfo(listingId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase
    .from('listings')
    .select(
      `
      id,
      country_id,
      province_id,
      district_id,
      area_id,
      address_text,
      latitude,
      longitude,
      location_accuracy,
      location_visibility,
      provinces!province_id(name, slug),
      districts!district_id(name, slug),
      areas!area_id(name, slug)
      `
    )
    .eq('id', listingId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch location: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  // Hide exact coordinates based on visibility
  let latitude = data.latitude;
  let longitude = data.longitude;

  if (data.location_visibility === 'approximate' && latitude && longitude) {
    // Add random offset to approximate location (0-1 km radius)
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.random() * 1; // 1 km max
    const latOffset = (randomDistance * Math.cos(randomAngle)) / 111; // 1 degree ~= 111 km
    const lonOffset = (randomDistance * Math.sin(randomAngle)) / 111;
    latitude = latitude + latOffset;
    longitude = longitude + lonOffset;
  } else if (data.location_visibility === 'hidden' || data.location_visibility === 'province_district') {
    latitude = null;
    longitude = null;
  }

  return {
    countryId: data.country_id,
    provinceId: data.province_id,
    districtId: data.district_id,
    areaId: data.area_id,
    provinceName: data.provinces?.[0]?.name,
    districtName: data.districts?.[0]?.name,
    areaName: data.areas?.[0]?.name,
    addressText: (data.location_visibility !== 'hidden' && data.location_visibility !== 'province_district') ? data.address_text : null,
    latitude,
    longitude,
    accuracy: data.location_accuracy,
    visibility: data.location_visibility,
  };
}
