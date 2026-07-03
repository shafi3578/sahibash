"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n/client";
import type { PostingState, LocationData, SellingMethod } from "@/lib/posting/types";
import { Step1BasicAd } from "./Step1BasicAd";
import { Step2CategoryFinding } from "./Step2CategoryFinding";
import { Step3Details } from "./Step3Details";
import { Step4ReviewPublish } from "./Step4ReviewPublish";

type NewPostingFormProps = {
  locale: string;
};

const INITIAL_STATE: PostingState = {
  photos: [],
  title: "",
  description: "",
  location: {
    useDeviceLocation: false,
    visibility: "province_district",
  },
  sellingMethod: "sell",
  selectedCategoryPath: [],
  finalCategoryNodeId: "",
  stableSpecs: {},
  sellerDetails: {},
  price: 0,
  currency: "AFN",
  negotiable: false,
  currentStep: 1,
  completedSteps: [],
  validationErrors: {},
};

export function NewPostingForm({ locale }: NewPostingFormProps) {
  const { t } = useTranslation(locale as any);
  const router = useRouter();
  const [state, setState] = useState<PostingState>(INITIAL_STATE);
  const [isPublishing, setIsPublishing] = useState(false);

  // Load draft from localStorage if exists
  useEffect(() => {
    const savedDraft = localStorage.getItem("posting_draft_v4");
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setState(draft);
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
    }
  }, []);

  // Save draft to localStorage
  useEffect(() => {
    localStorage.setItem("posting_draft_v4", JSON.stringify(state));
  }, [state]);

  const updateState = useCallback(
    (updates: Partial<PostingState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  const handleNextStep = useCallback(() => {
    const nextStep = Math.min(state.currentStep + 1, 4) as 1 | 2 | 3 | 4;
    const completedSteps = Array.from(
      new Set([...state.completedSteps, state.currentStep])
    );
    updateState({
      currentStep: nextStep,
      completedSteps,
    });
  }, [state.currentStep, state.completedSteps, updateState]);

  const handlePreviousStep = useCallback(() => {
    const prevStep = Math.max(state.currentStep - 1, 1) as 1 | 2 | 3 | 4;
    updateState({ currentStep: prevStep });
  }, [state.currentStep, updateState]);

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // TODO: Call server action to create listing
      // const result = await createListingAction({
      //   ...state,
      // });

      // For now, just show success
      alert(t("posting.publishSuccess") || "Listing published successfully!");
      localStorage.removeItem("posting_draft_v4");
      router.push(`/${locale}/listings`);
    } catch (error) {
      console.error("Publishing failed:", error);
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 px-4">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded transition ${
                step <= state.currentStep
                  ? "bg-blue-500"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>
        <div className="text-sm text-gray-600">
          {t("posting.step")} {state.currentStep} {t("posting.of")} 4
        </div>
      </div>

      {/* Steps */}
      {state.currentStep === 1 && (
        <Step1BasicAd
          state={state}
          onStateChange={updateState}
          onNext={handleNextStep}
          locale={locale}
        />
      )}

      {state.currentStep === 2 && (
        <Step2CategoryFinding
          state={state}
          onStateChange={updateState}
          onNext={handleNextStep}
          onBack={handlePreviousStep}
          locale={locale}
        />
      )}

      {state.currentStep === 3 && (
        <Step3Details
          state={state}
          onStateChange={updateState}
          onNext={handleNextStep}
          onBack={handlePreviousStep}
          locale={locale}
        />
      )}

      {state.currentStep === 4 && (
        <Step4ReviewPublish
          state={state}
          onPublish={handlePublish}
          onBack={handlePreviousStep}
          isPublishing={isPublishing}
          locale={locale}
        />
      )}
    </div>
  );
}
