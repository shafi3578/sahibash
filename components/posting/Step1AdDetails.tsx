'use client';

import { useState } from 'react';
import { LocationModalv2, LocationSelection } from './LocationModalv2';

interface Step1AdDetailsProps {
  onContinue: (data: AdDetailsData) => void;
}

export interface AdDetailsData {
  photos: File[];
  title: string;
  description: string;
  location: LocationSelection;
  contactOptions: string;
}

export const Step1AdDetails = ({ onContinue }: Step1AdDetailsProps) => {
  const [photos, setPhotos] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<LocationSelection | null>(null);
  const [contactOptions, setContactOptions] = useState('phone');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      if (photos.length + newPhotos.length > 10) {
        setErrors((prev) => ({ ...prev, photos: 'Maximum 10 photos allowed' }));
        return;
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photos;
        return newErrors;
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLocationSave = (selectedLocation: LocationSelection) => {
    setLocation(selectedLocation);
    setLocationModalOpen(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.location;
      return newErrors;
    });
  };

  const handleContinue = () => {
    const newErrors: Record<string, string> = {};

    if (photos.length === 0) newErrors.photos = 'At least 1 photo is required';
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!location) newErrors.location = 'Location is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onContinue({
      photos,
      title,
      description,
      location: location!,
      contactOptions,
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Post an Ad</h1>
      <p className="text-gray-600 mb-6">Step 1 of 4: Ad Details</p>

      {/* Photos Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos ({photos.length}/10)
        </label>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Photo ${index + 1}`}
                className="w-full h-24 object-cover"
              />
              <button
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
              >
                ×
              </button>
            </div>
          ))}
          
          {photos.length < 10 && (
            <label className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 h-24">
              <span className="text-2xl text-gray-400">+</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
        
        {errors.photos && <p className="text-red-500 text-sm">{errors.photos}</p>}
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Listing Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (e.target.value.trim()) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.title;
                return newErrors;
              });
            }
          }}
          placeholder="Enter Listing Title"
          maxLength={100}
          className={`w-full p-2 border rounded-lg text-sm ${
            errors.title ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
        {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (e.target.value.trim()) {
              setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.description;
                return newErrors;
              });
            }
          }}
          placeholder="Enter Description"
          maxLength={2000}
          rows={4}
          className={`w-full p-2 border rounded-lg text-sm ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <p className="text-xs text-gray-500 mt-1">{description.length}/2000</p>
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      {/* Location */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Location *
        </label>
        <button
          onClick={() => setLocationModalOpen(true)}
          className={`w-full p-2 border rounded-lg text-left text-sm ${
            errors.location ? 'border-red-500' : 'border-gray-300'
          } bg-white hover:bg-gray-50`}
        >
          {location
            ? `${location.city}, ${location.district}${location.neighborhood ? `, ${location.neighborhood}` : ''}`
            : 'Select Location'}
        </button>
        {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
      </div>

      {/* Contact Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contact Options
        </label>
        <select
          value={contactOptions}
          onChange={(e) => setContactOptions(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="phone">Phone Only</option>
          <option value="qa">Q&A Only</option>
          <option value="both">Phone and Q&A</option>
        </select>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleContinue}
        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Continue
      </button>

      {/* Location Modal */}
      <LocationModalv2
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onSave={handleLocationSave}
      />
    </div>
  );
};
