'use client';

import { useState } from 'react';

export type LocationVisibility = 'exact' | 'approximate' | 'hidden';

interface LocationInfo {
  countryId?: number | null;
  provinceId?: number | null;
  districtId?: number | null;
  areaId?: number | null;
  provinceName?: string | null;
  districtName?: string | null;
  areaName?: string | null;
  addressText?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  visibility: LocationVisibility | null;
}

interface LocationCardProps {
  location: LocationInfo;
  buyerDistance?: number; // Distance in km if available
}

export default function LocationCard({ location, buyerDistance }: LocationCardProps) {
  const [showDirections, setShowDirections] = useState(false);

  if (!location.provinceName && !location.districtName) {
    return null;
  }

  const getGoogleMapsUrl = () => {
    if (location.latitude && location.longitude) {
      return `https://www.google.com/maps/search/${location.latitude},${location.longitude}`;
    }
    const query = [location.provinceName, location.districtName, location.areaName]
      .filter(Boolean)
      .join(', ');
    return `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
  };

  const getWazeUrl = () => {
    if (location.latitude && location.longitude) {
      return `https://www.waze.com/navigate?to=${location.latitude},${location.longitude}`;
    }
    return '';
  };

  const renderLocationText = () => {
    if (location.visibility === 'hidden') {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            <strong>{location.provinceName}</strong>
            {location.districtName && ` / ${location.districtName}`}
          </p>
          <p className="text-xs text-gray-500 italic">
            🔒 Seller has hidden the exact location.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold text-gray-900">
          {location.provinceName}
          {location.districtName && ` / ${location.districtName}`}
          {location.areaName && ` / ${location.areaName}`}
        </p>
        {location.addressText && (
          <p className="text-sm text-gray-600">{location.addressText}</p>
        )}
        {location.visibility === 'approximate' && (
          <p className="text-xs text-gray-500 italic">
            📍 Approximate location only. Exact location is hidden by seller.
          </p>
        )}
        {buyerDistance && location.visibility === 'exact' && (
          <p className="text-xs font-medium text-blue-600">
            {buyerDistance.toFixed(1)} km away
          </p>
        )}
      </div>
    );
  };

  const canShowMap =
    location.visibility === 'exact' ||
    (location.visibility === 'approximate' &&
      location.latitude &&
      location.longitude);

  const canShowDirections = location.visibility === 'exact' && location.latitude && location.longitude;

  return (
    <div className="border rounded-lg p-4 bg-white">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900 mb-3">📍 Location</h3>

      {/* Location Text */}
      {renderLocationText()}

      {/* Map Preview Placeholder */}
      {canShowMap && (
        <div className="mt-4 bg-gray-100 rounded-lg h-48 flex items-center justify-center border border-gray-300">
          <div className="text-center text-gray-600">
            <p className="text-sm mb-1">
              {location.visibility === 'exact' ? '📍 Exact Location' : '🌍 Approximate Area'}
            </p>
            <p className="text-xs text-gray-500">
              Map integration coming soon. Open in external map below.
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Coordinates: {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {(canShowDirections || getGoogleMapsUrl()) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {canShowDirections && (
            <>
              <a
                href={getGoogleMapsUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors"
              >
                🗺️ Google Maps
              </a>
              {getWazeUrl() && (
                <a
                  href={getWazeUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors"
                >
                  🧭 Waze
                </a>
              )}
            </>
          )}
          {canShowDirections && (
            <button
              onClick={() => {
                if (location.latitude && location.longitude) {
                  navigator.clipboard.writeText(
                    `${location.latitude},${location.longitude}`
                  );
                  alert('Coordinates copied to clipboard');
                }
              }}
              className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
            >
              📋 Copy Coordinates
            </button>
          )}
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
        {location.visibility === 'exact' && (
          <p>✓ Full location details are visible to buyers.</p>
        )}
        {location.visibility === 'approximate' && (
          <p>✓ Only approximate area is visible. Exact coordinates are hidden.</p>
        )}
        {location.visibility === 'hidden' && (
          <p>✓ Only province and district are visible. Exact location is hidden.</p>
        )}
      </div>
    </div>
  );
}
