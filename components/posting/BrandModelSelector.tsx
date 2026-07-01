"use client";

import { useEffect, useMemo, useState } from "react";
import type { CatalogBrand, CatalogModel } from "@/lib/catalog/types";
import { loadCatalogBrands, loadCatalogModels, generateAutoFill, formatSpecValue } from "@/lib/catalog/utils";

interface BrandModelSelectorProps {
  category: "phones" | "vehicles" | "laptops" | "realEstate" | "tv" | "accessories";
  subcategory?: string;
  onModelSelected: (model: CatalogModel) => void;
  selectedBrandId?: string;
  selectedModelId?: string;
}

export function BrandModelSelector({
  category,
  subcategory,
  onModelSelected,
  selectedBrandId,
  selectedModelId,
}: BrandModelSelectorProps) {
  const [brands, setBrands] = useState<CatalogBrand[]>([]);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<CatalogModel | null>(null);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [activeBrand, setActiveBrand] = useState<string | null>(selectedBrandId || null);

  // Load brands on mount
  useEffect(() => {
    async function fetchBrands() {
      setLoadingBrands(true);
      const brandList = await loadCatalogBrands(category, subcategory);
      setBrands(brandList);
      setLoadingBrands(false);
    }
    fetchBrands();
  }, [category, subcategory]);

  // Load models when brand changes
  useEffect(() => {
    if (!activeBrand) {
      setModels([]);
      setSelectedModel(null);
      return;
    }

    async function fetchModels() {
      setLoadingModels(true);
      const modelList = await loadCatalogModels(category, activeBrand as string);
      setModels(modelList);
      setLoadingModels(false);
    }

    fetchModels();
  }, [activeBrand, category]);

  // Auto-fill specs when model is selected
  const autoFillData = useMemo(() => {
    if (!selectedModel) return null;
    return generateAutoFill(selectedModel);
  }, [selectedModel]);

  const handleBrandChange = (brandId: string) => {
    setActiveBrand(brandId);
  };

  const handleModelChange = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    if (model) {
      setSelectedModel(model);
      onModelSelected(model);
    }
  };

  return (
    <div className="space-y-4">
      {/* Brand Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand {activeBrand && <span className="text-green-600">✓</span>}
        </label>
        {loadingBrands ? (
          <div className="text-sm text-gray-500">Loading brands...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {brands.map((brand) => (
              <button
                key={brand.id}
                onClick={() => handleBrandChange(brand.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                  activeBrand === brand.id
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                }`}
              >
                {brand.name}
              </button>
            ))}
            </div>
          </>
        )}
      </div>

      {/* Model Selection */}
      {activeBrand && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Model {selectedModel && <span className="text-green-600">✓</span>}
          </label>
          {loadingModels ? (
            <div className="text-sm text-gray-500">Loading models...</div>
          ) : models.length > 0 ? (
            <>
              <select
                value={selectedModelId || selectedModel?.id || ""}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a model...</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className="text-sm text-gray-500 p-4 bg-yellow-50 rounded-lg">
              No models available for this brand yet. You can still post using manual details.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
