'use client';

import { useState, useCallback } from 'react';
import { ProvinceSelector } from './ProvinceSelector';
import { DistrictSelector } from './DistrictSelector';
import { AreaSelector } from './AreaSelector';
import { useProvinces, useDistricts, useAreas, useSubmitCustomArea } from '@/lib/location/hooks';
import type { LocationSelection, LocaleType, Province, District, Area } from '@/lib/location/types';
import { formatLocationDisplay, validateLocation } from '@/lib/location/utils';

interface LocationSelectorProps {
  onLocationChange: (location: LocationSelection | null) => void;
  locale?: LocaleType;
  initialSelection?: LocationSelection;
  required?: boolean;
  showErrors?: boolean;
}

/**
 * Afghanistan Location Selector
 * Progressive loading: Province > District > Area
 * Supports multilingual names (English, Dari, Pashto)
 * Allows custom area submission for admin approval
 */
export function LocationSelector({
  onLocationChange,
  locale = 'en',
  initialSelection,
  required = true,
  showErrors = true,
}: LocationSelectorProps) {
  // State
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(
    initialSelection?.province_id || null
  );
  const [selectedProvinceData, setSelectedProvinceData] = useState<Province | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(
    initialSelection?.district_id || null
  );
  const [selectedDistrictData, setSelectedDistrictData] = useState<District | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(
    initialSelection?.area_id || null
  );
  const [selectedAreaCustom, setSelectedAreaCustom] = useState<string | null>(
    initialSelection?.area_custom || null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch data
  const { provinces, loading: provincesLoading } = useProvinces();
  const { districts, loading: districtsLoading } = useDistricts(selectedProvinceId);
  const { areas, loading: areasLoading } = useAreas(selectedProvinceId, selectedDistrictId);
  const { submit: submitCustomArea } = useSubmitCustomArea();

  // Handlers
  const handleProvinceSelect = useCallback(
    (provinceId: string, province: Province) => {
      setSelectedProvinceId(provinceId);
      setSelectedProvinceData(province);
      // Reset district and area when province changes
      setSelectedDistrictId(null);
      setSelectedDistrictData(null);
      setSelectedAreaId(null);
      setSelectedAreaCustom(null);
      emitChange(provinceId, null, null, null);
    },
    []
  );

  const handleDistrictSelect = useCallback(
    (districtId: string, district: District) => {
      setSelectedDistrictId(districtId);
      setSelectedDistrictData(district);
      // Reset area when district changes
      setSelectedAreaId(null);
      setSelectedAreaCustom(null);
      emitChange(selectedProvinceId, districtId, null, null);
    },
    [selectedProvinceId]
  );

  const handleAreaSelect = useCallback(
    (areaId: string, area: Area) => {
      setSelectedAreaId(areaId);
      setSelectedAreaCustom(null);
      emitChange(selectedProvinceId, selectedDistrictId, areaId, null);
    },
    [selectedProvinceId, selectedDistrictId]
  );

  const handleCustomAreaSelect = useCallback(
    (customArea: string) => {
      setSelectedAreaId(null);
      setSelectedAreaCustom(customArea);
      emitChange(selectedProvinceId, selectedDistrictId, null, customArea);
    },
    [selectedProvinceId, selectedDistrictId]
  );

  const handleSubmitCustomArea = useCallback(
    async (nameEn: string, nameFa: string, namePs: string) => {
      if (!selectedProvinceId) return;

      await submitCustomArea(
        selectedProvinceId,
        nameEn,
        nameFa,
        namePs,
        selectedDistrictId || undefined
      );
    },
    [selectedProvinceId, selectedDistrictId, submitCustomArea]
  );

  // Helper to emit location change
  const emitChange = (
    provinceId: string | null,
    districtId: string | null,
    areaId: string | null,
    areaCustom: string | null
  ) => {
    const location: LocationSelection = {
      province_id: provinceId || '',
      province_name: selectedProvinceData?.name_en,
      district_id: districtId || undefined,
      district_name: selectedDistrictData?.name_en,
      area_id: areaId || undefined,
      area_custom: areaCustom || undefined,
      location_gps_private: true,
    };

    // Validate
    const validationErrors = validateLocation(provinceId, districtId, areaId, areaCustom);
    setErrors(validationErrors);

    // Emit if valid or not required to be valid yet
    if (Object.keys(validationErrors).length === 0 || !required) {
      onLocationChange(Object.keys(validationErrors).length === 0 ? location : null);
    }
  };

  const displayText = formatLocationDisplay(
    selectedProvinceData,
    selectedDistrictData,
    null,
    selectedAreaCustom,
    locale
  );

  return (
    <div className="space-y-4">
      {displayText && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900 font-medium">
            ✓ Selected: <strong>{displayText}</strong>
          </p>
        </div>
      )}

      {/* Province Selector */}
      {provincesLoading ? (
        <div className="text-sm text-gray-500">Loading provinces...</div>
      ) : (
        <ProvinceSelector
          provinces={provinces}
          selectedProvinceId={selectedProvinceId}
          onSelect={handleProvinceSelect}
          locale={locale}
          showSearch={true}
        />
      )}

      {showErrors && errors.province && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          ⚠️ {errors.province}
        </p>
      )}

      {/* District Selector */}
      {selectedProvinceId && (
        <DistrictSelector
          districts={districts}
          selectedDistrictId={selectedDistrictId}
          onSelect={handleDistrictSelect}
          locale={locale}
          loading={districtsLoading}
          showSearch={true}
        />
      )}

      {showErrors && errors.district && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          ⚠️ {errors.district}
        </p>
      )}

      {/* Area Selector */}
      {selectedProvinceId && (
        <AreaSelector
          areas={areas}
          selectedAreaId={selectedAreaId}
          selectedAreaCustom={selectedAreaCustom}
          onSelectArea={handleAreaSelect}
          onSelectCustom={handleCustomAreaSelect}
          locale={locale}
          loading={areasLoading}
          showSearch={true}
          allowCustomInput={true}
          onSubmitCustomArea={handleSubmitCustomArea}
        />
      )}
    </div>
  );
}
