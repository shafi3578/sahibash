"use client";

import { useState, useEffect } from "react";

interface PhoneModel {
  id: string;
  model_name_en: string;
  model_name_fa?: string;
  model_name_ps?: string;
  screen_size?: string;
  rear_camera_mp?: string;
  front_camera_mp?: string;
  operating_system: string;
  release_year?: number;
}

interface PhoneModelSelectorProps {
  brandId: string;
  brandName: string;
  onModelSelect: (
    modelId: string,
    modelName: string,
    specs: Record<string, string>
  ) => void;
  onBack: () => void;
}

export function PhoneModelSelector({
  brandId,
  brandName,
  onModelSelect,
  onBack,
}: PhoneModelSelectorProps) {
  const [models, setModels] = useState<PhoneModel[]>([]);
  const [filteredModels, setFilteredModels] = useState<PhoneModel[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setFetching(true);
        const response = await fetch(
          `/api/phone/models?brandId=${encodeURIComponent(brandId)}`
        );
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Failed to load models");
        }

        setModels(result.data);
        setFilteredModels(result.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load phone models";
        setError(message);
        console.error("Error loading phone models:", err);
      } finally {
        setFetching(false);
      }
    };

    fetchModels();
  }, [brandId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModels(models);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = models.filter((model) => {
      return (
        model.model_name_en.toLowerCase().includes(query) ||
        (model.model_name_fa || "").toLowerCase().includes(query) ||
        (model.model_name_ps || "").toLowerCase().includes(query)
      );
    });

    setFilteredModels(filtered);
  }, [searchQuery, models]);

  const handleModelClick = (model: PhoneModel) => {
    const specs = {
      screen_size: model.screen_size || "Unknown",
      rear_camera: model.rear_camera_mp || "Unknown",
      front_camera: model.front_camera_mp || "Unknown",
      operating_system: model.operating_system,
    };
    onModelSelect(model.id, model.model_name_en, specs);
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back
        </button>
        <h3 className="font-semibold text-gray-800">{brandName}</h3>
      </div>

      {/* Search Box */}
      <div>
        <input
          type="text"
          placeholder="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Models List */}
      {fetching ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-600">
          No models found
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredModels.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelClick(model)}
              className="w-full p-3 text-left border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
            >
              <div className="font-medium text-gray-900">
                {model.model_name_en}
              </div>
              {model.model_name_fa && (
                <div className="text-sm text-gray-600">{model.model_name_fa}</div>
              )}
              {model.screen_size && (
                <div className="text-xs text-gray-500 mt-1">
                  {model.screen_size} • {model.operating_system}
                  {model.release_year && ` • ${model.release_year}`}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
