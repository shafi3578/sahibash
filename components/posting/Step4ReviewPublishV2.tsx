'use client';

import { useState } from 'react';
import { AdDetailsData } from './Step1AdDetails';

interface Step4ReviewPublishV2Props {
  adDetails: AdDetailsData;
  selectedProduct: string;
  specifications: Record<string, any>;
  onBack: () => void;
  onPublish: () => Promise<void>;
  isPublishing?: boolean;
}

export function Step4ReviewPublishV2({
  adDetails,
  selectedProduct,
  specifications,
  onBack,
  onPublish,
  isPublishing = false,
}: Step4ReviewPublishV2Props) {
  const [error, setError] = useState('');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = async () => {
    setError('');
    setPublishing(true);
    try {
      await onPublish();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to publish listing'
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Review Your Listing</h2>
        <p className="text-gray-600 text-sm">Step 4 of 4: Preview and publish</p>
      </div>

      {/* Photos Preview */}
      <div className="mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">
          Photos ({adDetails.photos.length}/10)
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {adDetails.photos.map((photo, index) => (
            <div key={index} className="bg-gray-200 rounded-lg overflow-hidden aspect-square">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Basic Info */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Listing Information</h3>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Title</p>
            <p className="font-medium text-gray-900">{adDetails.title}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Description</p>
            <p className="text-gray-900 whitespace-pre-wrap">{adDetails.description}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="font-medium text-gray-900">
              {adDetails.location.city}, {adDetails.location.district}
              {adDetails.location.neighborhood && `, ${adDetails.location.neighborhood}`}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Contact Options</p>
            <p className="font-medium text-gray-900 capitalize">
              {adDetails.contactOptions}
            </p>
          </div>
        </div>
      </div>

      {/* Product & Specifications */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Product & Specifications</h3>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Product</p>
            <p className="font-medium text-gray-900">{selectedProduct}</p>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm text-gray-600 mb-2">Specifications</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(specifications).map(([key, value]) => (
                <div key={key} className="bg-white p-2 rounded border border-gray-100">
                  <p className="text-xs text-gray-600 capitalize">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="font-medium text-gray-900">
                    {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Publishing Terms */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
        <p className="font-medium mb-2">Before Publishing:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Make sure all information is accurate and complete</li>
          <li>Your ad will be visible to all users immediately after publishing</li>
          <li>You can edit your listing anytime from your dashboard</li>
          <li>Your contact information will be protected</li>
        </ul>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          disabled={publishing || isPublishing}
        >
          Back
        </button>
        <button
          onClick={handlePublish}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          disabled={publishing || isPublishing}
        >
          {publishing || isPublishing ? 'Publishing...' : 'Publish Listing'}
        </button>
      </div>
    </div>
  );
}
