'use client';

import { useState } from 'react';

export type LocationVisibility = 'exact' | 'approximate' | 'hidden';

interface LocationPrivacyProps {
  initialVisibility?: LocationVisibility;
  defaultByCategory?: LocationVisibility;
  categoryName?: string;
  onVisibilityChange: (visibility: LocationVisibility) => void;
}

const visibilityOptions: Array<{
  value: LocationVisibility;
  title: string;
  description: string;
  icon: string;
  recommendation?: string;
}> = [
  {
    value: 'exact',
    title: 'Show Exact Location',
    description: 'Buyers see your exact location on the map with precise coordinates.',
    icon: '📍',
    recommendation: 'Best for real estate',
  },
  {
    value: 'approximate',
    title: 'Show Approximate Area Only',
    description: 'Buyers see your province, district, and area. Exact location is hidden.',
    icon: '🌍',
    recommendation: 'Recommended for vehicles and personal items',
  },
  {
    value: 'hidden',
    title: 'Hide Exact Location',
    description: 'Buyers only see province and district. Full privacy for your exact location.',
    icon: '🔒',
  },
];

export default function LocationPrivacy({
  initialVisibility = 'approximate',
  defaultByCategory,
  categoryName,
  onVisibilityChange,
}: LocationPrivacyProps) {
  const [selected, setSelected] = useState<LocationVisibility>(
    defaultByCategory || initialVisibility
  );

  const handleSelect = (visibility: LocationVisibility) => {
    setSelected(visibility);
    onVisibilityChange(visibility);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Location Privacy
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose who can see your exact listing location.
        </p>
      </div>

      {defaultByCategory && categoryName && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
          <p className="font-medium">
            Default for {categoryName}: {visibilityOptions.find((opt) => opt.value === defaultByCategory)?.title}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {visibilityOptions.map((option) => (
          <label
            key={option.value}
            className="flex items-start p-3 border-2 rounded-lg cursor-pointer transition-colors"
            style={{
              borderColor: selected === option.value ? '#3b82f6' : '#e5e7eb',
              backgroundColor:
                selected === option.value ? '#eff6ff' : '#ffffff',
            }}
          >
            <input
              type="radio"
              name="location-visibility"
              value={option.value}
              checked={selected === option.value}
              onChange={() => handleSelect(option.value)}
              className="w-4 h-4 mt-1 mr-3 flex-shrink-0"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{option.icon}</span>
                <p className="font-semibold text-gray-900">{option.title}</p>
                {option.recommendation && (
                  <span className="ml-auto inline-block px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                    {option.recommendation}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Privacy behavior explanation */}
      <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 space-y-1">
        <p className="font-semibold">What buyers will see:</p>
        <div className="space-y-1">
          <p>
            <strong>Exact:</strong> Your precise map pin, full address, coordinates.
          </p>
          <p>
            <strong>Approximate:</strong> Province, district, area. Approximate location circle, not exact pin.
          </p>
          <p>
            <strong>Hidden:</strong> Province and district only. No map, no coordinates.
          </p>
        </div>
      </div>
    </div>
  );
}
