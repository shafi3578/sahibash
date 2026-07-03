'use client';

import { useState } from 'react';
import { Step1AdDetails, AdDetailsData } from './Step1AdDetails';
import { Step2CategorySelection } from './Step2CategorySelection';
import { Step3Specifications } from './Step3Specifications';
import { Step4ReviewPublishV2 } from './Step4ReviewPublishV2';

export const NewPostingFormv2 = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [adDetails, setAdDetails] = useState<AdDetailsData | null>(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [categoryPath, setCategoryPath] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<Record<string, any>>({});
  const [isPublishing, setIsPublishing] = useState(false);

  const handleStep1Continue = (data: AdDetailsData) => {
    setAdDetails(data);
    setCurrentStep(2);
  };

  const handleStep2Continue = (product: string, path: string[]) => {
    setSelectedProduct(product);
    setCategoryPath(path);
    setCurrentStep(3);
  };

  const handleStep3Continue = (specs: Record<string, any>) => {
    setSpecifications(specs);
    setCurrentStep(4);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('Listing published successfully!');
      // Reset form or redirect
      setCurrentStep(1);
      setAdDetails(null);
      setSelectedProduct('');
      setCategoryPath([]);
      setSpecifications({});
    } catch (error) {
      alert('Failed to publish listing');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Step Indicator */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto p-4">
          <div className="flex justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex-1">
                <div
                  className={`h-1 mb-2 rounded-full ${
                    step <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
                <p className="text-xs text-gray-600 text-center">
                  Step {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        {currentStep === 1 && <Step1AdDetails onContinue={handleStep1Continue} />}
        
        {currentStep === 2 && adDetails && (
          <Step2CategorySelection onContinue={handleStep2Continue} onBack={handleBack} />
        )}
        
        {currentStep === 3 && adDetails && selectedProduct && (
          <Step3Specifications
            selectedProduct={selectedProduct}
            onContinue={handleStep3Continue}
            onBack={handleBack}
          />
        )}
        
        {currentStep === 4 && adDetails && selectedProduct && (
          <Step4ReviewPublishV2
            adDetails={adDetails}
            selectedProduct={selectedProduct}
            specifications={specifications}
            onBack={handleBack}
            onPublish={handlePublish}
            isPublishing={isPublishing}
          />
        )}
      </div>
    </div>
  );
};
