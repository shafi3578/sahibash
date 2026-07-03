'use client';

import { useState, useMemo } from 'react';
import { District, LocaleType } from '../location/types';
import { getLocalizedName, searchDistricts } from '../location/utils';

interface DistrictSelectorProps {
  districts: District[];
  selectedDistrictId: string | null;
  onSelect: (districtId: string, district: District) => void;
  locale: LocaleType;
  disabled?: boolean;
  loading?: boolean;
  showSearch?: boolean;
  label?: string;
}

export function DistrictSelector({
  districts,
  selectedDistrictId,
  onSelect,
  locale,
  disabled = false,
  loading = false,
  showSearch = true,
  label = 'District',
}: DistrictSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDistricts = useMemo(() => {
    return searchDistricts(districts, searchQuery, locale);
  }, [districts, searchQuery, locale]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} *
        <span className="text-red-500 ml-1">Required</span>
      </label>

      {loading && (
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500">
          Loading districts...
        </div>
      )}

      {!loading && districts.length === 0 && (
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500">
          Select a province first
        </div>
      )}

      {!loading && districts.length > 0 && (
        <>
          {showSearch && (
            <input
              type="text"
              placeholder="Search districts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {filteredDistricts.length === 0 ? (
              <p className="col-span-full text-center text-sm text-gray-500 py-4">
                No districts found
              </p>
            ) : (
              filteredDistricts.map((district) => (
                <button
                  key={district.id}
                  onClick={() => onSelect(district.id, district)}
                  disabled={disabled}
                  className={`p-2 text-left text-sm rounded-lg transition border-2 ${
                    selectedDistrictId === district.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {getLocalizedName(district, locale)}
                </button>
              ))
            )}
          </div>

          {filteredDistricts.length > 0 && (
            <p className="text-xs text-gray-500">
              Showing {filteredDistricts.length} district
              {filteredDistricts.length !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}
    </div>
  );
}
