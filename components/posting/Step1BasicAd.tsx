"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import type { PostingState, SellingMethod, LocationData } from "@/lib/posting/types";
import { LocationModal } from "./LocationModal";
import { SellingMethodSelector } from "./SellingMethodSelector";

type Step1BasicAdProps = {
  state: PostingState;
  onStateChange: (updates: Partial<PostingState>) => void;
  onNext: () => void;
  locale: string;
};

export function Step1BasicAd({
  state,
  onStateChange,
  onNext,
  locale,
}: Step1BasicAdProps) {
  const { t } = useTranslation(locale as any);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [photoError, setPhotoError] = useState("");

  const handlePhotosUpload = async (files: FileList) => {
    setPhotoError("");
    if (!files) return;

    const maxPhotos = 10;
    const newPhotos = [...state.photos];

    if (newPhotos.length + files.length > maxPhotos) {
      setPhotoError(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        setPhotoError("Only image files are allowed");
        return;
      }

      // TODO: Upload to storage and get URL
      // For now, create local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPhotos.push(e.target.result as string);
          onStateChange({ photos: newPhotos });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSave = (location: LocationData) => {
    onStateChange({ location });
    setLocationModalOpen(false);
  };

  const isStepValid =
    state.photos.length > 0 &&
    state.title.trim().length > 0 &&
    state.description.trim().length > 0 &&
    state.location.provinceId &&
    state.location.districtId &&
    state.sellingMethod;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{t("posting.step1.title") || "Step 1: Basic Ad"}</h2>
        <p className="text-gray-600">
          {t("posting.step1.description") ||
            "Upload photos, write your title and description, and tell us where the item is located."}
        </p>
      </div>

      {/* Photos Upload */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          {t("posting.photos") || "Photos"} * (Min 1, Max 10)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handlePhotosUpload(e.target.files!)}
            className="hidden"
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="cursor-pointer">
            <p className="text-lg font-semibold mb-2">{t("posting.uploadPhotos") || "Click to upload"}</p>
            <p className="text-sm text-gray-500">{t("posting.dragPhotos") || "or drag and drop"}</p>
          </label>
        </div>
        {photoError && <p className="text-red-500 text-sm mt-2">{photoError}</p>}

        {/* Photo Preview */}
        {state.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {state.photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photo}
                  alt={`Photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() =>
                    onStateChange({
                      photos: state.photos.filter((_, i) => i !== idx),
                    })
                  }
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          {t("posting.title") || "Title"} *
        </label>
        <input
          type="text"
          value={state.title}
          onChange={(e) => onStateChange({ title: e.target.value })}
          placeholder={t("posting.titlePlaceholder") || "e.g., iPhone 13 Pro Max 256GB"}
          maxLength={100}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">{state.title.length} / 100</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold mb-1">
          {t("posting.description") || "Description"} *
        </label>
        <textarea
          value={state.description}
          onChange={(e) => onStateChange({ description: e.target.value })}
          placeholder={t("posting.descriptionPlaceholder") ||
            "Describe your item in detail. Condition, features, any damage, etc."}
          maxLength={2000}
          rows={5}
          className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">{state.description.length} / 2000</p>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold mb-2">
          {t("posting.location") || "Location"} *
        </label>
        <button
          onClick={() => setLocationModalOpen(true)}
          className="w-full px-4 py-2 border-2 border-gray-300 rounded hover:border-blue-500 transition text-left"
        >
          {state.location.provinceId && state.location.districtId ? (
            <span>
              📍 {state.location.provinceName || "Province"} - {state.location.districtName || "District"}
              {state.location.areaText && ` - ${state.location.areaText}`}
            </span>
          ) : (
            <span className="text-gray-400">{t("posting.selectLocation") || "Click to select location"}</span>
          )}
        </button>
        <LocationModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          onSave={handleLocationSave}
          initialLocation={state.location}
          locale={locale}
        />
      </div>

      {/* Selling Method */}
      <SellingMethodSelector
        value={state.sellingMethod}
        onChange={(method) => onStateChange({ sellingMethod: method })}
        locale={locale}
      />

      {/* Next Button */}
      <div className="flex gap-3">
        <button
          onClick={onNext}
          disabled={!isStepValid}
          className="flex-1 px-4 py-3 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          {t("common.continue") || "Continue to Category"}
        </button>
      </div>
    </div>
  );
}
