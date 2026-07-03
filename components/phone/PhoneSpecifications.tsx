"use client";

import { useState, useEffect } from "react";

interface SpecField {
  label: string;
  value: string;
  locked: boolean;
}

interface SelectableField {
  id: string;
  field_key: string;
  field_label_en: string;
  field_label_fa: string;
  field_label_ps: string;
  field_type: string;
  options_json?: Record<string, any>;
  is_required: boolean;
}

interface PhoneSpecificationsProps {
  modelName: string;
  operatingSystem: string;
  lockedSpecs: Record<string, string>;
  onFieldsChange: (fields: Record<string, string>) => void;
  onBack: () => void;
}

export function PhoneSpecifications({
  modelName,
  operatingSystem,
  lockedSpecs,
  onFieldsChange,
  onBack,
}: PhoneSpecificationsProps) {
  const [selectableFields, setSelectableFields] = useState<SelectableField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchFields = async () => {
      try {
        setFetching(true);
        const response = await fetch(
          `/api/phone/fields?os=${encodeURIComponent(operatingSystem)}`
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load fields");
        }

        setSelectableFields(result.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load specifications";
        setError(message);
        console.error("Error loading phone fields:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchFields();
  }, [operatingSystem]);

  const handleFieldChange = (fieldKey: string, value: string) => {
    const updated = { ...fieldValues, [fieldKey]: value };
    setFieldValues(updated);
    onFieldsChange(updated);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back
        </button>
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back
        </button>
        <h3 className="font-semibold text-gray-800">{modelName}</h3>
      </div>

      {/* Locked Specifications Section */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">
          Device Specifications (Auto-Filled)
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(lockedSpecs).map(([key, value]) => (
            <div key={key}>
              <div className="text-sm text-gray-600 capitalize">
                {key.replace(/_/g, " ")}
              </div>
              <div className="font-medium text-gray-900">{value}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
        These specifications are automatically filled from the database and cannot be changed.
        </p>
      </div>

      {/* Seller-Selectable Fields Section */}
      {fetching ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : selectableFields.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
          No additional specifications needed
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-800">
            Phone Details
          </h4>
          {selectableFields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.field_label_en}
                {field.field_label_fa && (
                  <span className="ml-2 text-gray-500">{field.field_label_fa}</span>
                )}
                {field.is_required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.field_type === "select" && field.options_json?.options ? (
                <select
                  value={fieldValues[field.field_key] || ""}
                  onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required={field.is_required}
                >
                  <option value="">Select...</option>
                  {field.options_json.options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : field.field_type === "number" ? (
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={fieldValues[field.field_key] || ""}
                  onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                  placeholder="0-100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required={field.is_required}
                />
              ) : field.field_type === "boolean" ? (
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={field.field_key}
                      value="yes"
                      checked={fieldValues[field.field_key] === "yes"}
                      onChange={() => handleFieldChange(field.field_key, "yes")}
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={field.field_key}
                      value="no"
                      checked={fieldValues[field.field_key] === "no"}
                      onChange={() => handleFieldChange(field.field_key, "no")}
                    />
                    <span>No</span>
                  </label>
                </div>
              ) : (
                <input
                  type="text"
                  value={fieldValues[field.field_key] || ""}
                  onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required={field.is_required}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
