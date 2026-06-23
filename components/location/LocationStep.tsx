'use client';

import { useState } from 'react';
import LocationGeolocation from './LocationGeolocation';
import LocationSelector from './LocationSelector';
import LocationMapPicker from './LocationMapPicker';
import LocationPrivacy, { LocationVisibility } from './LocationPrivacy';

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
  const [method, setMethod] = useState<LocationMethod>('method-select');
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>(
    initialLocation || {}
  );

  const handleGeolocationDetected = (location: any) => {
    setSelectedLocation(location);
    setMethod('privacy');
  };

  const handleManualLocationSelect = (location: any) => {
    setSelectedLocation({ ...selectedLocation, ...location });
    setMethod('privacy');
  };

  const handleMapLocationSelected = (location: any) => {
    setSelectedLocation({ ...selectedLocation, ...location });
    setMethod('privacy');
  };

  const handlePrivacyChange = (visibility: LocationVisibility) => {
    setSelectedLocation({ ...selectedLocation, visibility });
  };

  const handleSaveLocation = () => {
    if (!selectedLocation.provinceId && !selectedLocation.latitude) {
      alert('Please select a location first');
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
            How would you like to add the location?
          </h2>

          <button
            onClick={() => setMethod('current-location')}
            className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-semibold text-gray-900">📍 Use My Current Location</div>
            <p className="text-sm text-gray-600 mt-1">
              Let Sahibash detect your location automatically (faster)
            </p>
          </button>

          <button
            onClick={() => setMethod('manual')}
            className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-semibold text-gray-900">🌍 Select Manually</div>
            <p className="text-sm text-gray-600 mt-1">
              Choose province, district, and area from lists
            </p>
          </button>

          <button
            onClick={() => setMethod('map')}
            className="w-full p-4 text-left border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
          >
            <div className="font-semibold text-gray-900">📌 Choose on Map</div>
            <p className="text-sm text-gray-600 mt-1">
              Enter or adjust coordinates on a map
            </p>
          </button>

          <button
            onClick={() => {
              setSelectedLocation({});
              setMethod('privacy');
            }}
            className="w-full p-4 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
          >
            <div className="font-semibold">⏭️ Skip for Now</div>
            <p className="text-sm text-gray-600 mt-1">
              Add location details later
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
            ← Back
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
            ← Back
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
            ← Change Location
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
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
