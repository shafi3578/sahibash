'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUiTranslations } from '@/lib/i18n/ui';
import type { AppLocale } from '@/lib/i18n/translations';

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
  const pathname = usePathname();
  const pathLocale = pathname?.split('/')[1];
  const locale: AppLocale = pathLocale === 'fa' || pathLocale === 'ps' ? pathLocale : 'en';
  const ui = getUiTranslations(locale);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const errorMsg = ui.location.geolocationNotSupported;
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
        let errorMsg = ui.location.geolocationUnavailable;
        if (err.code === 1) {
          errorMsg = ui.location.geolocationPermissionDenied;
        } else if (err.code === 2) {
          errorMsg = ui.location.geolocationPositionUnavailable;
        } else if (err.code === 3) {
          errorMsg = ui.location.geolocationTimedOut;
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
          📍 {ui.location.geolocationTitle}
        </h3>
        <p className="text-sm text-blue-800 mb-4">
          {ui.location.geolocationDescription}
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
            {loading ? ui.location.gettingLocation : ui.location.useCurrentLocation}
          </button>

          <button
            onClick={onSkip}
            className="w-full px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
          >
            {ui.location.selectManually}
          </button>
        </div>
      </div>
    </div>
  );
}
