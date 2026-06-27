'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { getUiTranslations } from '@/lib/i18n/ui';
import type { AppLocale } from '@/lib/i18n/translations';

// Map component - will be loaded dynamically to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), {
  ssr: false,
  loading: () => <div className="w-full h-96 bg-gray-100 flex items-center justify-center">Loading...</div>,
});

const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), {
  ssr: false,
});

const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), {
  ssr: false,
});

const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), {
  ssr: false,
});

interface MapLocation {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

interface LocationMapPickerProps {
  onLocationSelected: (location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) => void;
  initialLocation?: MapLocation;
}

// Fallback simple map component (no leaflet required)
function SimpleMapPicker({ onLocationSelected, initialLocation }: LocationMapPickerProps) {
  const pathname = usePathname();
  const pathLocale = pathname?.split('/')[1];
  const locale: AppLocale = pathLocale === 'fa' || pathLocale === 'ps' ? pathLocale : 'en';
  const ui = getUiTranslations(locale);
  const [latitude, setLatitude] = useState<string>(
    initialLocation?.latitude?.toString() || '34.52'
  );
  const [longitude, setLongitude] = useState<string>(
    initialLocation?.longitude?.toString() || '69.18'
  );
  const [accuracy, setAccuracy] = useState<string>(
    initialLocation?.accuracy?.toString() || '50'
  );

  const handleSave = () => {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const acc = accuracy ? parseInt(accuracy) : undefined;

    if (isNaN(lat) || isNaN(lng)) {
      alert(ui.location.invalidCoordinates);
      return;
    }

    onLocationSelected({
      latitude: lat,
      longitude: lng,
      accuracy: acc,
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <div>
        <p className="text-sm text-gray-600 mb-3">
          📍 {ui.location.mapDescription}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {ui.location.latitude}
          </label>
          <input
            type="number"
            step="0.0001"
            min="-90"
            max="90"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder={ui.location.latitudePlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {ui.location.longitude}
          </label>
          <input
            type="number"
            step="0.0001"
            min="-180"
            max="180"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder={ui.location.longitudePlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {ui.location.accuracyOptional}
        </label>
        <input
          type="number"
          min="0"
          value={accuracy}
          onChange={(e) => setAccuracy(e.target.value)}
          placeholder={ui.location.accuracyPlaceholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        {ui.location.saveLocation}
      </button>
    </div>
  );
}

export default function LocationMapPicker({
  onLocationSelected,
  initialLocation,
}: LocationMapPickerProps) {
  const [leafletAvailable, setLeafletAvailable] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    // Check if leaflet is available
    if (typeof window !== 'undefined') {
      try {
        require('leaflet');
        setLeafletAvailable(true);
      } catch (e) {
        // Leaflet not installed, use fallback
        setLeafletAvailable(false);
      }
    }
  }, []);

  // For now, always use the simple picker since leaflet requires additional setup
  // In production, you could add: npm install leaflet react-leaflet
  return <SimpleMapPicker onLocationSelected={onLocationSelected} initialLocation={initialLocation} />;
}
