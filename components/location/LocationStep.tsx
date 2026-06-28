'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import LocationGeolocation from './LocationGeolocation';
import LocationSelector from './LocationSelector';
import LocationMapPicker from './LocationMapPicker';
import LocationPrivacy, { LocationVisibility } from './LocationPrivacy';
import { getUiTranslations } from '@/lib/i18n/ui';
import type { AppLocale } from '@/lib/i18n/translations';

type LocationMethod = 'method-select' | 'current-location' | 'manual' | 'map' | 'privacy';

interface SelectedLocation {
  countryId?: number;
  provinceId?: number;
  districtId?: number;
  areaId?: number;
  addressText?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  visibility?: LocationVisibility;
}

interface LocationStepProps {
  onComplete: (location: SelectedLocation) => void;
  initialLocation?: SelectedLocation;
  categoryName?: string;
  defaultPrivacyByCategory?: LocationVisibility;
}

// Default privacy levels by category
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

export default function LocationStep({
  onComplete,
  initialLocation,
  categoryName,
  defaultPrivacyByCategory,
}: LocationStepProps) {
  const pathname = usePathname();
  const pathLocale = pathname?.split('/')[1];
  const locale: AppLocale = pathLocale === 'fa' || pathLocale === 'ps' ? pathLocale : 'en';
  const ui = getUiTranslations(locale);
  const [method, setMethod] = useState<LocationMethod>('method-select');
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>(
    initialLocation || {}
  );

  const handleGeolocationDetected = (location: SelectedLocation) => {
    setSelectedLocation(location);
    setMethod('privacy');
  };

  const handleManualLocationSelect = (location: SelectedLocation) => {
    setSelectedLocation({ ...selectedLocation, ...location });
    setMethod('privacy');
  };

  const handleMapLocationSelected = (location: SelectedLocation) => {
    setSelectedLocation({ ...selectedLocation, ...location });
    setMethod('privacy');
  };

  const handlePrivacyChange = (visibility: LocationVisibility) => {
    setSelectedLocation({ ...selectedLocation, visibility });
  };

  const handleSaveLocation = () => {
    if (!selectedLocation.provinceId && !selectedLocation.latitude) {
      alert(ui.location.selectLocationFirst);
      return;
    }

    onComplete({
      ...selectedLocation,
      visibility: selectedLocation.visibility || 'approximate',
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Method Selection */}
      {method === 'method-select' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {ui.location.methodTitle}
          </h2>

          <button
            onClick={() => setMethod('current-location')}
            className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-semibold text-gray-900">📍 {ui.location.methodCurrentTitle}</div>
            <p className="text-sm text-gray-600 mt-1">
              {ui.location.methodCurrentDescription}
            </p>
          </button>

          <button
            onClick={() => setMethod('manual')}
            className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-semibold text-gray-900">🌍 {ui.location.methodManualTitle}</div>
            <p className="text-sm text-gray-600 mt-1">
              {ui.location.methodManualDescription}
            </p>
          </button>

          <button
            onClick={() => setMethod('map')}
            className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-semibold text-gray-900">📌 {ui.location.methodMapTitle}</div>
            <p className="text-sm text-gray-600 mt-1">
              {ui.location.methodMapDescription}
            </p>
          </button>

          <button
            onClick={() => {
              setSelectedLocation({});
              setMethod('privacy');
            }}
            className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <div className="font-semibold">⏭️ {ui.location.methodSkipTitle}</div>
            <p className="text-sm text-gray-600 mt-1">
              {ui.location.methodSkipDescription}
            </p>
          </button>
        </div>
      )}

      {/* Geolocation Method */}
      {method === 'current-location' && (
        <div className="space-y-4">
          <LocationGeolocation
            onLocationDetected={handleGeolocationDetected}
            onSkip={() => setMethod('manual')}
            onError={(error) => {
              console.error('Geolocation error:', error);
              // Show error and offer to try manual
              setMethod('manual');
            }}
          />
        </div>
      )}

      {/* Manual Selection Method */}
      {method === 'manual' && (
        <div className="space-y-4">
          <button
            onClick={() => setMethod('method-select')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← {ui.location.back}
          </button>
          <LocationSelector
            onLocationSelect={handleManualLocationSelect}
            initialProvince={selectedLocation.provinceId}
            initialDistrict={selectedLocation.districtId}
            initialArea={selectedLocation.areaId}
            initialAddress={selectedLocation.addressText}
          />
        </div>
      )}

      {/* Map Selection Method */}
      {method === 'map' && (
        <div className="space-y-4">
          <button
            onClick={() => setMethod('method-select')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium mb-4"
          >
            ← {ui.location.back}
          </button>
          <LocationMapPicker
            onLocationSelected={handleMapLocationSelected}
            initialLocation={selectedLocation}
          />
        </div>
      )}

      {/* Privacy Selection */}
      {method === 'privacy' && (
        <div className="space-y-6">
          <button
            onClick={() => setMethod('method-select')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            ← {ui.location.changeLocation}
          </button>

          <LocationPrivacy
            initialVisibility={selectedLocation.visibility || 'approximate'}
            defaultByCategory={
              defaultPrivacyByCategory ||
              (categoryName ? DEFAULT_PRIVACY_BY_CATEGORY[categoryName] : 'approximate')
            }
            categoryName={categoryName}
            onVisibilityChange={handlePrivacyChange}
          />

          <button
            onClick={handleSaveLocation}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
          >
            {ui.location.continue}
          </button>
        </div>
      )}
    </div>
  );
}
