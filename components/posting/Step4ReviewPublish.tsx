"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import type { PostingState } from "@/lib/posting/types";

type Step4ReviewPublishProps = {
  state: PostingState;
  onPublish: () => Promise<void>;
  onBack: () => void;
  isPublishing?: boolean;
  locale?: string;
};

export function Step4ReviewPublish({
  state,
  onPublish,
  onBack,
  isPublishing,
  locale = "en",
}: Step4ReviewPublishProps) {
  const { t } = useTranslation(locale as any);
  const [error, setError] = useState("");

  const handlePublish = async () => {
    setError("");
    try {
      await onPublish();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("posting.publishError") || "Failed to publish listing"
      );
    }
  };

  const categoryPath =
    state.selectedCategoryPath
      .map((n) => n.name || n.slug)
      .join(" > ") || t("posting.notSelected") || "Not Selected";

  const sellingMethodLabels: Record<string, string> = {
    sell: t("selling_method.sell") || "Sell",
    rent: t("selling_method.rent") || "Rent",
    exchange: t("selling_method.exchange") || "Exchange",
    wanted: t("selling_method.wanted") || "Wanted",
    negotiable: t("selling_method.negotiable") || "Negotiable",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">
          {t("posting.step4.title") || "Step 4: Review & Publish"}
        </h2>
        <p className="text-gray-600">
          {t("posting.step4.description") ||
            "Review your listing before publishing. Make sure everything looks correct."}
        </p>
      </div>

      {/* Clean Preview */}
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Photos */}
        {state.photos.length > 0 && (
          <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              src={state.photos[0]}
              alt="Main photo"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-800">{state.title}</h3>

          {/* Price */}
          <div className="text-3xl font-bold text-green-600">
            {state.price.toLocaleString()} {state.currency}
            {state.minimumOffer && (
              <span className="text-sm text-gray-600 ml-2">
                (min: {state.minimumOffer.toLocaleString()})
              </span>
            )}
            {state.negotiable && (
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded ml-2">
                {t("posting.negotiable") || "Negotiable"}
              </span>
            )}
          </div>

          {/* Location */}
          <div className="text-gray-700 flex items-center gap-2">
            <span>📍</span>
            <span>
              {state.location.provinceName} - {state.location.districtName}
              {state.location.areaText && ` - ${state.location.areaText}`}
            </span>
          </div>

          {/* Category */}
          <div className="text-gray-700 flex items-center gap-2">
            <span>📁</span>
            <span>{categoryPath}</span>
          </div>

          {/* Selling Method */}
          <div className="text-gray-700 flex items-center gap-2">
            <span>🔄</span>
            <span>{sellingMethodLabels[state.sellingMethod]}</span>
          </div>

          {/* Description */}
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-800 mb-2">
              {t("posting.description") || "Description"}
            </h4>
            <p className="text-gray-700 whitespace-pre-wrap">
              {state.description}
            </p>
          </div>

          {/* Auto-filled Specs */}
          {Object.keys(state.stableSpecs).length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-800 mb-2">
                {t("posting.specifications") || "Specifications"}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(state.stableSpecs).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-gray-600">
                      {key.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <p className="font-semibold text-gray-800">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seller Details */}
          {Object.keys(state.sellerDetails).length > 0 && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-800 mb-2">
                {t("posting.details") || "Details"}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(state.sellerDetails)
                  .filter(([, v]) => v !== null && v !== undefined && v !== "")
                  .map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-600">
                        {key.replace(/_/g, " ").toUpperCase()}
                      </span>
                      <p className="font-semibold text-gray-800">
                        {typeof value === "boolean"
                          ? value
                            ? "Yes"
                            : "No"
                          : String(value)}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Photo Gallery */}
          {state.photos.length > 1 && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600 mb-2">
                {state.photos.length} {t("posting.photosIncluded") || "photos"}
              </p>
              <div className="grid grid-cols-4 gap-2">
                {state.photos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded overflow-hidden bg-gray-100"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isPublishing}
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {t("common.back") || "Back"}
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="flex-1 px-4 py-3 bg-green-500 text-white rounded font-semibold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {isPublishing
            ? t("posting.publishing") || "Publishing..."
            : t("posting.publishListing") || "Publish Listing"}
        </button>
      </div>
    </div>
  );
}
