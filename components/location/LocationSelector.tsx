'use client';

import { useEffect, useState } from 'react';

interface Province {
  id: number;
  name: string;
  slug: string;
}

interface District {
  id: number;
  name: string;
  slug: string;
}

interface Area {
  id: number;
  name: string;
  slug: string;
}

interface LocationSelectorProps {
  onLocationSelect: (location: {
    countryId: number;
    provinceId: number;
    districtId: number;
    areaId?: number;
    addressText?: string;
  }) => void;
  initialProvince?: number;
  initialDistrict?: number;
  initialArea?: number;
  initialAddress?: string;
}

type LocationApiOption = {
  id: number | string;
  name?: string | null;
  name_en?: string | null;
  slug?: string | null;
};
type LocationApiResponse<T> = { success?: boolean; data?: T[] };

function toLocationOption(option: LocationApiOption) {
  const id = Number(option.id);
  const name = String(option.name ?? option.name_en ?? '').trim();
  const slug = String(option.slug ?? '').trim();
  return Number.isFinite(id) && name ? { id, name, slug } : null;
}

async function fetchLocationOptions<T extends LocationApiOption>(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) return [];
  const payload = (await response.json()) as LocationApiResponse<T>;
  return payload.success && Array.isArray(payload.data) ? payload.data : [];
}

export default function LocationSelector({
  onLocationSelect,
  initialProvince,
  initialDistrict,
  initialArea,
  initialAddress,
}: LocationSelectorProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<number | null>(
    initialProvince || null
  );
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(
    initialDistrict || null
  );
  const [selectedArea, setSelectedArea] = useState<number | null>(
    initialArea || null
  );
  const [addressText, setAddressText] = useState<string>(
    initialAddress || ''
  );

  const [loading, setLoading] = useState(true);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const rows = (await fetchLocationOptions('/api/location/provinces'))
          .map(toLocationOption)
          .filter((row): row is Province => Boolean(row));
        setProvinces(rows);
      } catch (error) {
        console.error('Error loading provinces:', error);
      }
      setLoading(false);
    };

    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    const loadDistricts = async () => {
      if (!selectedProvince) {
        setDistricts([]);
        setSelectedDistrict(null);
        setAreas([]);
        setSelectedArea(null);
        return;
      }

      try {
        const rows = (await fetchLocationOptions(
          `/api/location/districts?province_id=${encodeURIComponent(String(selectedProvince))}`
        ))
          .map(toLocationOption)
          .filter((row): row is District => Boolean(row));
        setDistricts(rows);
        setSelectedDistrict(null);
        setAreas([]);
        setSelectedArea(null);
      } catch (error) {
        console.error('Error loading districts:', error);
      }
    };

    loadDistricts();
  }, [selectedProvince]);

  // Load areas when district changes
  useEffect(() => {
    const loadAreas = async () => {
      if (!selectedDistrict) {
        setAreas([]);
        setSelectedArea(null);
        return;
      }

      try {
        const rows = (await fetchLocationOptions(
          `/api/location/areas?province_id=${encodeURIComponent(String(selectedProvince))}&district_id=${encodeURIComponent(String(selectedDistrict))}`
        ))
          .map(toLocationOption)
          .filter((row): row is Area => Boolean(row));
        setAreas(rows);
        setSelectedArea(null);
      } catch (error) {
        console.error('Error loading areas:', error);
      }
    };

    loadAreas();
  }, [selectedDistrict, selectedProvince]);

  // Notify parent of location changes
  useEffect(() => {
    if (selectedProvince && selectedDistrict) {
      onLocationSelect({
        countryId: 1, // Afghanistan
        provinceId: selectedProvince,
        districtId: selectedDistrict,
        areaId: selectedArea || undefined,
        addressText: addressText || undefined,
      });
    }
  }, [selectedProvince, selectedDistrict, selectedArea, addressText, onLocationSelect]);

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading locations...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Province Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Province <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedProvince || ''}
          onChange={(e) => setSelectedProvince(e.target.value ? Number(e.target.value) : null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Province</option>
          {provinces.map((prov) => (
            <option key={prov.id} value={String(prov.id)}>
              {prov.name}
            </option>
          ))}
        </select>
      </div>

      {/* District Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          District <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedDistrict || ''}
          onChange={(e) => setSelectedDistrict(e.target.value ? Number(e.target.value) : null)}
          disabled={!selectedProvince || districts.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Select District</option>
          {districts.map((dist) => (
            <option key={dist.id} value={String(dist.id)}>
              {dist.name}
            </option>
          ))}
        </select>
      </div>

      {/* Area Select (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Neighborhood (Optional)
        </label>
        <select
          value={selectedArea || ''}
          onChange={(e) => setSelectedArea(e.target.value ? Number(e.target.value) : null)}
          disabled={!selectedDistrict || areas.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Select Area (Optional)</option>
          {areas.map((area) => (
            <option key={area.id} value={String(area.id)}>
              {area.name}
            </option>
          ))}
        </select>
      </div>

      {/* Address Text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Address (Optional)
        </label>
        <input
          type="text"
          value={addressText}
          onChange={(e) => setAddressText(e.target.value)}
          placeholder="e.g., House 123, Lane 5"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Summary */}
      {selectedProvince && selectedDistrict && (
        <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-900">
          <p className="font-medium">
            Selected Location:
          </p>
          <p className="mt-1">
            {provinces.find((p) => p.id === selectedProvince)?.name}
            {' / '}
            {districts.find((d) => d.id === selectedDistrict)?.name}
            {selectedArea && ` / ${areas.find((a) => a.id === selectedArea)?.name}`}
            {addressText && ` (${addressText})`}
          </p>
        </div>
      )}
    </div>
  );
}
