"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import type { LocationData } from "@/lib/posting/types";

type LocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: LocationData) => void;
  initialLocation?: LocationData;
  locale: string;
};

export function LocationModal({
  isOpen,
  onClose,
  onSave,
  initialLocation,
  locale,
}: LocationModalProps) {
  const { t } = useTranslation(locale as any);
  const [method, setMethod] = useState<"auto" | "manual">(
    initialLocation?.useDeviceLocation ? "auto" : "manual"
  );
  const [provinceId, setProvinceId] = useState(initialLocation?.provinceId || "");
  const [districtId, setDistrictId] = useState(initialLocation?.districtId || "");
  const [areaText, setAreaText] = useState(initialLocation?.areaText || "");
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    // Load provinces
    const loadProvinces = async () => {
      try {
        // TODO: fetch provinces from API
        // For now, use placeholder
        setProvinces([
          { id: 1, name: "Kabul" },
          { id: 2, name: "Herat" },
          { id: 3, name: "Kandahar" },
        ]);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    // Load districts when province changes
    if (provinceId) {
      const loadDistricts = async () => {
        try {
          // TODO: fetch districts from API based on provinceId
          setDistricts([
            { id: 1, name: "District 1" },
            { id: 2, name: "District 2" },
          ]);
        } catch (error) {
          console.error("Failed to load districts:", error);
        }
      };
      loadDistricts();
    }
  }, [provinceId]);

  const handleUseDeviceLocation = async () => {
    setLoading(true);
    try {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          onSave({
            useDeviceLocation: true,
            latitude,
            longitude,
            visibility: "exact",
            provinceId: provinceId ? Number(provinceId) : undefined,
            districtId: districtId ? Number(districtId) : undefined,
          });
          onClose();
        });
      }
    } catch (error) {
      console.error("Failed to get device location:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveManualLocation = () => {
    if (!provinceId || !districtId) {
      alert("Province and District are required");
      return;
    }

    onSave({
      useDeviceLocation: false,
      provinceId: Number(provinceId),
      districtId: Number(districtId),
      areaText,
      visibility: "province_district",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t("location.title") || "Select Location"}</h2>

        {/* Method Selection */}
        <div className="mb-6">
          <p className="text-sm font-semibold mb-3">{t("location.method") || "How?"}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setMethod("auto")}
              className={`flex-1 px-4 py-2 rounded border-2 transition ${
                method === "auto"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              {t("location.useDevice") || "Auto"}
            </button>
            <button
              onClick={() => setMethod("manual")}
              className={`flex-1 px-4 py-2 rounded border-2 transition ${
                method === "manual"
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 bg-white hover:border-gray-400"
              }`}
            >
              {t("location.manual") || "Manual"}
            </button>
          </div>
        </div>

        {/* Auto Location */}
        {method === "auto" && (
          <div className="mb-6">
            <button
              onClick={handleUseDeviceLocation}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? "Getting location..." : t("location.useCurrentLocation") || "Use Current Location"}
            </button>
          </div>
        )}

        {/* Manual Location */}
        {method === "manual" && (
          <div className="space-y-4">
            {/* Province */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                {t("location.province") || "Province"} *
              </label>
              <select
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t("location.selectProvince") || "Select..."}</option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* District */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                {t("location.district") || "District"} *
              </label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                disabled={!provinceId}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">{t("location.selectDistrict") || "Select..."}</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Area (Optional) */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                {t("location.area") || "Area"} {t("common.optional") || "(Optional)"}
              </label>
              <input
                type="text"
                value={areaText}
                onChange={(e) => setAreaText(e.target.value)}
                placeholder={t("location.areaPlaceholder") || "e.g., Wazir Akbar Khan"}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            {t("common.cancel") || "Cancel"}
          </button>
          <button
            onClick={method === "auto" ? handleUseDeviceLocation : handleSaveManualLocation}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {t("common.save") || "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
