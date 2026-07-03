'use client';

import { useState } from 'react';
import {
  LOCATION_DATA,
  getCities,
  getDistricts,
  getNeighborhoods,
} from '@/lib/posting/location-data';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: LocationSelection) => void;
}

export interface LocationSelection {
  country: string;
  city: string;
  district: string;
  neighborhood?: string;
}

export const LocationModalv2 = ({ isOpen, onClose, onSave }: LocationModalProps) => {
  const [step, setStep] = useState<'country' | 'city' | 'district' | 'neighborhood'>(
    'country'
  );
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');

  if (!isOpen) return null;

  const countries = LOCATION_DATA;
  const cities = selectedCountry ? getCities(selectedCountry) : [];
  const districts = selectedCountry && selectedCity 
    ? getDistricts(selectedCountry, selectedCity) 
    : [];
  const neighborhoods = selectedCountry && selectedCity && selectedDistrict
    ? getNeighborhoods(selectedCountry, selectedCity, selectedDistrict)
    : [];

  const handleSave = () => {
    if (!selectedCountry || !selectedCity || !selectedDistrict) {
      alert('Please select country, city, and district');
      return;
    }
    
    const country = countries.find(c => c.id === selectedCountry);
    const city = cities.find(c => c.id === selectedCity);
    const district = districts.find(d => d.id === selectedDistrict);
    const neighborhood = neighborhoods.find(n => n.id === selectedNeighborhood);

    onSave({
      country: country?.name || '',
      city: city?.name || '',
      district: district?.name || '',
      neighborhood: neighborhood?.name,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="w-full bg-white rounded-t-lg shadow-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Location Selection</h2>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Country Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setSelectedCity('');
                setSelectedDistrict('');
                setSelectedNeighborhood('');
              }}
              className="w-full p-2 border rounded-lg"
            >
              <option value="">Select Country</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Selection */}
          {selectedCountry && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City / Province *
              </label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  setSelectedDistrict('');
                  setSelectedNeighborhood('');
                }}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* District Selection */}
          {selectedCity && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                District *
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedNeighborhood('');
                }}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Neighborhood Selection */}
          {selectedDistrict && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Neighborhood (Optional)
              </label>
              <select
                value={selectedNeighborhood}
                onChange={(e) => setSelectedNeighborhood(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Select Neighborhood</option>
                {neighborhoods.map((neighborhood) => (
                  <option key={neighborhood.id} value={neighborhood.id}>
                    {neighborhood.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
