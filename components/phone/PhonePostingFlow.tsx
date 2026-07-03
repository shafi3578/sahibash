"use client";

import { useState } from "react";
import { PhoneBrandSelector } from "./PhoneBrandSelector";
import { PhoneModelSelector } from "./PhoneModelSelector";
import { PhoneSpecifications } from "./PhoneSpecifications";

export type PhoneFlowStep =
  | "brand-selection"
  | "model-selection"
  | "specifications";

interface PhonePostingFlowProps {
  onComplete: (data: {
    brandId: string;
    brandName: string;
    modelId: string;
    modelName: string;
    operatingSystem: string;
    lockedSpecs: Record<string, string>;
    sellerFields: Record<string, string>;
  }) => void;
  onCancel: () => void;
}

export function PhonePostingFlow({
  onComplete,
  onCancel,
}: PhonePostingFlowProps) {
  const [step, setStep] = useState<PhoneFlowStep>("brand-selection");
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string | null>(null);
  const [selectedOS, setSelectedOS] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [selectedModelName, setSelectedModelName] = useState<string | null>(null);
  const [lockedSpecs, setLockedSpecs] = useState<Record<string, string>>({});
  const [sellerFields, setSellerFields] = useState<Record<string, string>>({});

  const handleBrandSelect = (
    brandId: string,
    brandName: string,
    os: string
  ) => {
    setSelectedBrandId(brandId);
    setSelectedBrandName(brandName);
    setSelectedOS(os);
    setStep("model-selection");
  };

  const handleModelSelect = (
    modelId: string,
    modelName: string,
    specs: Record<string, string>
  ) => {
    setSelectedModelId(modelId);
    setSelectedModelName(modelName);
    setLockedSpecs(specs);
    setStep("specifications");
  };

  const handleFieldsChange = (fields: Record<string, string>) => {
    setSellerFields(fields);
  };

  const handleComplete = () => {
    if (!selectedBrandId || !selectedModelId || !selectedOS) {
      console.error("Missing required data for phone posting");
      return;
    }

    onComplete({
      brandId: selectedBrandId,
      brandName: selectedBrandName || "",
      modelId: selectedModelId,
      modelName: selectedModelName || "",
      operatingSystem: selectedOS,
      lockedSpecs,
      sellerFields,
    });
  };

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className={`${step === "brand-selection" ? "font-semibold text-blue-600" : ""}`}>
          1. Brand
        </div>
        <div className={`${step === "model-selection" ? "font-semibold text-blue-600" : ""}`}>
          2. Model
        </div>
        <div className={`${step === "specifications" ? "font-semibold text-blue-600" : ""}`}>
          3. Specifications
        </div>
      </div>

      {/* Main Content */}
      {step === "brand-selection" && (
        <PhoneBrandSelector onBrandSelect={handleBrandSelect} />
      )}

      {step === "model-selection" && selectedBrandId && selectedBrandName && (
        <PhoneModelSelector
          brandId={selectedBrandId}
          brandName={selectedBrandName}
          onModelSelect={handleModelSelect}
          onBack={() => setStep("brand-selection")}
        />
      )}

      {step === "specifications" &&
        selectedModelName &&
        selectedOS && (
          <>
            <PhoneSpecifications
              modelName={selectedModelName}
              operatingSystem={selectedOS}
              lockedSpecs={lockedSpecs}
              onFieldsChange={handleFieldsChange}
              onBack={() => setStep("model-selection")}
            />
            <div className="flex gap-3 pt-4">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="flex-1 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Continue to Photos
              </button>
            </div>
          </>
        )}
    </div>
  );
}
