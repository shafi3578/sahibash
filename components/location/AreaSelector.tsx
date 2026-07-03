'use client';

import { useState, useMemo } from 'react';
import { Area, LocaleType } from '../location/types';
import { getLocalizedName, searchAreas } from '../location/utils';

interface AreaSelectorProps {
  areas: Area[];
  selectedAreaId: string | null;
  selectedAreaCustom: string | null;
  onSelectArea: (areaId: string, area: Area) => void;
  onSelectCustom: (customAreaName: string) => void;
  locale: LocaleType;
  disabled?: boolean;
  loading?: boolean;
  showSearch?: boolean;
  allowCustomInput?: boolean;
  onSubmitCustomArea?: (
    nameEn: string,
    nameFa: string,
    namePs: string
  ) => Promise<void>;
}

export function AreaSelector({
  areas,
  selectedAreaId,
  selectedAreaCustom,
  onSelectArea,
  onSelectCustom,
  locale,
  disabled = false,
  loading = false,
  showSearch = true,
  allowCustomInput = true,
  onSubmitCustomArea,
}: AreaSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [submittingCustom, setSubmittingCustom] = useState(false);

  const filteredAreas = useMemo(() => {
    return searchAreas(areas, searchQuery, locale);
  }, [areas, searchQuery, locale]);

  const handleSubmitCustom = async () => {
    if (!customInput.trim()) return;

    setSubmittingCustom(true);
    try {
      if (onSubmitCustomArea) {
        await onSubmitCustomArea(customInput, customInput, customInput);
      }
      onSelectCustom(customInput);
      setCustomInput('');
    } catch (error) {
      console.error('Failed to submit custom area:', error);
    } finally {
      setSubmittingCustom(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Area / Neighborhood
        <span className="text-gray-500 ml-1">(Optional)</span>
      </label>

      {loading && (
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-500">
          Loading areas...
        </div>
      )}

      {!loading && areas.length > 0 && (
        <>
          {showSearch && (
            <input
              type="text"
              placeholder="Search areas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {filteredAreas.length === 0 ? (
              <p className="col-span-full text-center text-sm text-gray-500 py-3">
                No areas found
              </p>
            ) : (
              filteredAreas.map((area) => (
                <button
                  key={area.id}
                  onClick={() => onSelectArea(area.id, area)}
                  disabled={disabled}
                  className={`p-2 text-left text-sm rounded-lg transition border-2 ${
                    selectedAreaId === area.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={area.is_popular ? 'Popular area' : 'User-submitted'}
                >
                  {getLocalizedName(area, locale)}
                  {area.is_popular && <span className="text-xs ml-1">⭐</span>}
                </button>
              ))
            )}
          </div>

          {filteredAreas.length > 0 && (
            <p className="text-xs text-gray-500">
              Showing {filteredAreas.length} area{filteredAreas.length !== 1 ? 's' : ''}
            </p>
          )}
        </>
      )}

      {allowCustomInput && (
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs text-gray-600">
            {areas.length === 0
              ? 'No pre-defined areas yet. Enter your custom area:'
              : "Don't see your area? Enter it here:"}
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter custom area name..."
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitCustom();
                }
              }}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled || submittingCustom}
            />
            <button
              onClick={handleSubmitCustom}
              disabled={!customInput.trim() || disabled || submittingCustom}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {submittingCustom ? 'Submitting...' : 'Add'}
            </button>
          </div>

          {selectedAreaCustom && (
            <p className="text-sm text-blue-600 flex items-center gap-1">
              ✓ Custom area: <strong>{selectedAreaCustom}</strong>
              <span className="text-xs text-gray-500">(pending approval)</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
