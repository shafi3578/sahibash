'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

interface GeolocationLocation {
  countryId: number;
  provinceId?: number;
  districtId?: number;
  areaId?: number;
  latitude: number;
  longitude: number;
  accuracy?: number;
}

interface LocationGeolocationProps {
  onLocationDetected: (location: GeolocationLocation) => void;
  onError?: (error: string) => void;
  onSkip?: () => void;
}

export default function LocationGeolocation({
  onLocationDetected,
  onError,
  onSkip,
}: LocationGeolocationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by your browser';
      setError(errorMsg);
      onError?.(errorMsg);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;

        // Try to reverse geocode to find province/district
        // For now, just send coordinates; in real scenario you'd use PostGIS or external service
        onLocationDetected({
          countryId: 1, // Afghanistan
          latitude,
          longitude,
          accuracy: Math.round(accuracy),
        });

        setLoading(false);
      },
      (err) => {
        let errorMsg = 'Unable to retrieve location';
        if (err.code === 1) {
          errorMsg = 'Location permission denied. Please enable location access.';
        } else if (err.code === 2) {
          errorMsg = 'Position information is unavailable.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out.';
        }

        setError(errorMsg);
        onError?.(errorMsg);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          📍 Use Your Current Location
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          We'll use your device location to automatically fill in your listing location. You can review and change it before publishing.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-900">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={requestLocation}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium text-sm transition-colors"
          >
            {loading ? 'Getting Your Location...' : 'Use My Current Location'}
          </button>

          <button
            onClick={onSkip}
            className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            Select Manually Instead
          </button>
        </div>
      </div>
    </div>
  );
}
