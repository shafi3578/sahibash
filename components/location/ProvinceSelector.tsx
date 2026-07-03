'use client';

import { useState, useMemo } from 'react';
import { Province, LocaleType } from '@/lib/location/types';
import { getLocalizedName, searchProvinces } from '@/lib/location/utils';

interface ProvinceSelectorProps {
  provinces: Province[];
  selectedProvinceId: string | null;
  onSelect: (provinceId: string, province: Province) => void;
  locale: LocaleType;
  disabled?: boolean;
  showSearch?: boolean;
}

export function ProvinceSelector({
  provinces,
  selectedProvinceId,
  onSelect,
  locale,
  disabled = false,
  showSearch = true,
}: ProvinceSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProvinces = useMemo(() => {
    return searchProvinces(provinces, searchQuery, locale);
  }, [provinces, searchQuery, locale]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Province *
        <span className="text-red-500 ml-1">Required</span>
      </label>

      {showSearch && (
        <input
          type="text"
          placeholder="Search provinces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={disabled}
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
        {filteredProvinces.length === 0 ? (
          <p className="col-span-full text-center text-sm text-gray-500 py-4">
            No provinces found
          </p>
        ) : (
          filteredProvinces.map((province) => (
            <button
              key={province.id}
              onClick={() => onSelect(province.id, province)}
              disabled={disabled}
              className={`p-2 text-left text-sm rounded-lg transition border-2 ${
                selectedProvinceId === province.id
                  ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {getLocalizedName(province, locale)}
            </button>
          ))
        )}
      </div>

      {filteredProvinces.length > 0 && (
        <p className="text-xs text-gray-500">
          Showing {filteredProvinces.length} province{filteredProvinces.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
