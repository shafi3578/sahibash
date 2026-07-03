"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";

interface PhoneBrand {
  id: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  slug: string;
  logo_url?: string;
}

interface PhoneBrandSelectorProps {
  onBrandSelect: (brandId: string, brandName: string, os: string) => void;
  isLoading?: boolean;
}

export function PhoneBrandSelector({
  onBrandSelect,
  isLoading = false,
}: PhoneBrandSelectorProps) {
  const t = useTranslations();
  const [brands, setBrands] = useState<PhoneBrand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setFetching(true);
        const response = await fetch("/api/phone/brands");
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load brands");
        }

        setBrands(result.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load phone brands";
        setError(message);
        console.error("Error loading phone brands:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchBrands();
  }, []);

  const handleBrandClick = (brand: PhoneBrand) => {
    // TODO: Determine OS from brand - for now using Android as default except Apple
    const os = brand.slug === "apple" ? "iOS" : brand.slug === "huawei" ? "HarmonyOS" : "Android";
    onBrandSelect(brand.id, brand.name_en, os);
  };

  if (fetching || isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800 mb-4">
        {t("mobile_phones.select_brand", "Select a Brand")}
      </h3>
      <div className="grid grid-cols-1 gap-2">
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => handleBrandClick(brand)}
            className="p-3 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <div className="font-medium text-gray-900">{brand.name_en}</div>
            <div className="text-sm text-gray-600">{brand.name_fa}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
