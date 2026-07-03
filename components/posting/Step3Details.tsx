"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/client";
import type { PostingState, PostingFieldSchema } from "@/lib/posting/types";
import { FieldRenderer } from "./FieldRenderer";
import { getSchemaForCategory } from "@/lib/posting/schemas";

type Step3DetailsProps = {
  state: PostingState;
  onStateChange: (updates: Partial<PostingState>) => void;
  onNext: () => void;
  onBack: () => void;
  locale?: string;
};

export function Step3Details({
  state,
  onStateChange,
  onNext,
  onBack,
  locale = "en",
}: Step3DetailsProps) {
  const { t } = useTranslation(locale as any);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [schema, setSchema] = useState<PostingFieldSchema[]>([]);

  // Load schema based on selected category
  useEffect(() => {
    if (state.finalCategoryNodeId) {
      const loadedSchema = getSchemaForCategory(state.finalCategoryNodeId);
      setSchema(loadedSchema);
    } else {
      setSchema([]);
    }
  }, [state.finalCategoryNodeId]);

  const validatePrice = () => {
    const newErrors: Record<string, string> = {};

    if (!state.price || state.price <= 0) {
      newErrors.price = t("validation.priceRequired") || "Price is required";
    }

    if (
      state.minimumOffer &&
      state.minimumOffer > state.price
    ) {
      newErrors.minimumOffer =
        t("validation.minimumOfferHigher") || "Minimum offer cannot be higher than asking price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePrice()) {
      onNext();
    }
  };

  const categoryName =
    state.selectedCategoryPath.length > 0
      ? state.selectedCategoryPath[state.selectedCategoryPath.length - 1].name ||
        state.selectedCategoryPath[state.selectedCategoryPath.length - 1].slug
      : "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          {t("posting.step3.title") || "Step 3: Details & Price"}
        </h2>
        <p className="text-gray-600">
          {t("posting.step3.description") ||
            "Complete the details for your item. Some fields are auto-filled from your category selection."}
        </p>
      </div>

      {/* Auto-filled Specs (Locked) */}
      {Object.keys(state.stableSpecs).length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>🔒</span> {t("posting.autoFilledSpecs") || "Auto-filled Specifications"}
          </h3>
          <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
            {Object.entries(state.stableSpecs).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-4">
                <label className="text-sm font-semibold text-gray-700">
                  {key.replace(/_/g, " ").toUpperCase()}
                </label>
                <div className="px-3 py-2 bg-white border rounded text-gray-700">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                // TODO: Allow changing category/model
              }}
              className="text-xs text-blue-500 hover:underline mt-2"
            >
              {t("posting.changeModel") || "Change model?"}
            </button>
          </div>
        </div>
      )}

      {/* Seller-specific Details */}
      <div>
        <h3 className="font-semibold mb-3">
          {t("posting.sellerDetails") || `${categoryName} Details`}
        </h3>
        <div className="space-y-4">
          {schema.length > 0 ? (
            schema.map((field) => (
              <FieldRenderer
                key={field.id}
                field={field}
                value={state.sellerDetails[field.id]}
                onChange={(newValue) =>
                  onStateChange({
                    sellerDetails: {
                      ...state.sellerDetails,
                      [field.id]: newValue,
                    },
                  })
                }
                locale={locale}
              />
            ))
          ) : (
            <p className="text-gray-600 text-sm">
              {t("posting.noFieldsConfigured") ||
                "Fields for this category will be shown here"}
            </p>
          )}
        </div>
      </div>

      {/* Price Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <h3 className="font-semibold">
          {t("posting.pricing") || "Pricing"} *
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Asking Price */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              {t("posting.askingPrice") || "Asking Price"} *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={state.price || ""}
                onChange={(e) =>
                  onStateChange({ price: Number(e.target.value) })
                }
                placeholder="0"
                className={`flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                  errors.price
                    ? "border-red-500 focus:ring-red-500"
                    : "focus:ring-blue-500"
                }`}
              />
              <select
                value={state.currency}
                onChange={(e) =>
                  onStateChange({
                    currency: e.target.value as "AFN" | "USD",
                  })
                }
                className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AFN">AFN</option>
                <option value="USD">USD</option>
              </select>
            </div>
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">{errors.price}</p>
            )}
          </div>

          {/* Minimum Offer */}
          <div>
            <label className="block text-sm font-semibold mb-1">
              {t("posting.minimumOffer") || "Minimum Acceptable Offer"} (Optional)
            </label>
            <input
              type="number"
              value={state.minimumOffer || ""}
              onChange={(e) =>
                onStateChange({
                  minimumOffer: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="Leave empty if no minimum"
              className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${
                errors.minimumOffer
                  ? "border-red-500 focus:ring-red-500"
                  : "focus:ring-blue-500"
              }`}
            />
            {errors.minimumOffer && (
              <p className="text-red-500 text-sm mt-1">
                {errors.minimumOffer}
              </p>
            )}
          </div>
        </div>

        {/* Negotiable Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.negotiable}
            onChange={(e) =>
              onStateChange({ negotiable: e.target.checked })
            }
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            {t("posting.negotiable") || "Price is negotiable"}
          </span>
        </label>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded font-semibold hover:bg-gray-50 transition"
        >
          {t("common.back") || "Back"}
        </button>
        <button
          onClick={handleNext}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 transition"
        >
          {t("common.continue") || "Continue to Review"}
        </button>
      </div>
    </div>
  );
}
