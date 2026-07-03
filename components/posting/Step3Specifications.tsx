'use client';

import { useState, useEffect } from 'react';
import { getProductSpecs } from '@/lib/posting/product-specs';

interface Step3SpecificationsProps {
  selectedProduct: string;
  onContinue: (specs: Record<string, any>) => void;
  onBack: () => void;
}

export const Step3Specifications = ({
  selectedProduct,
  onContinue,
  onBack,
}: Step3SpecificationsProps) => {
  const [specs, setSpecs] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const productSpecs = getProductSpecs(selectedProduct);

  useEffect(() => {
    if (productSpecs) {
      // Initialize editable specs
      const initialSpecs: Record<string, any> = {};
      productSpecs.editableSpecs.forEach((spec) => {
        initialSpecs[spec.id] = '';
      });
      setSpecs(initialSpecs);
    }
  }, [selectedProduct, productSpecs]);

  const handleSpecChange = (specId: string, value: any) => {
    setSpecs((prev) => ({ ...prev, [specId]: value }));
    // Clear error for this spec
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[specId];
      return newErrors;
    });
  };

  const handleSubmit = () => {
    // Validate required specs
    const newErrors: Record<string, string> = {};
    if (productSpecs) {
      productSpecs.editableSpecs.forEach((spec) => {
        if (spec.required && !specs[spec.id]) {
          newErrors[spec.id] = `${spec.label} is required`;
        }
      });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onContinue(specs);
  };

  if (!productSpecs) {
    return <div className="p-4 text-center">Product not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Item Specifications</h2>
        <p className="text-gray-600 text-sm">{productSpecs.categoryPath}</p>
      </div>

      {/* Auto-filled Specifications */}
      {productSpecs.autoFilledSpecs.length > 0 && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-4 text-gray-800">Auto-filled Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {productSpecs.autoFilledSpecs.map((spec) => (
              <div key={spec.label} className="bg-white p-3 rounded border border-gray-100">
                <div className="text-sm text-gray-600">{spec.label}</div>
                <div className="font-semibold text-gray-900 mt-1">{spec.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editable Specifications */}
      <div className="mb-6">
        <h3 className="font-semibold mb-4 text-gray-800">Details</h3>
        <div className="space-y-4">
          {productSpecs.editableSpecs.map((spec) => (
            <div key={spec.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {spec.label}
                {spec.required && <span className="text-red-500">*</span>}
              </label>

              {spec.type === 'select' && spec.options && (
                <select
                  value={specs[spec.id] || ''}
                  onChange={(e) => handleSpecChange(spec.id, e.target.value)}
                  className={`w-full p-2 border rounded-lg text-sm ${
                    errors[spec.id] ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select {spec.label}</option>
                  {spec.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}

              {spec.type === 'number' && (
                <input
                  type="number"
                  value={specs[spec.id] || ''}
                  onChange={(e) => handleSpecChange(spec.id, e.target.value)}
                  placeholder={spec.placeholder}
                  className={`w-full p-2 border rounded-lg text-sm ${
                    errors[spec.id] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {spec.type === 'text' && (
                <input
                  type="text"
                  value={specs[spec.id] || ''}
                  onChange={(e) => handleSpecChange(spec.id, e.target.value)}
                  placeholder={spec.placeholder}
                  className={`w-full p-2 border rounded-lg text-sm ${
                    errors[spec.id] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {spec.type === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={specs[spec.id] || false}
                  onChange={(e) => handleSpecChange(spec.id, e.target.checked)}
                  className="w-4 h-4"
                />
              )}

              {errors[spec.id] && (
                <p className="text-red-500 text-xs mt-1">{errors[spec.id]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
