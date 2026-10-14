"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/client";
import type { LocationData } from "@/lib/posting/types";
import { AFGHAN_PROVINCES, getProvinceLabel } from "@/lib/constants/marketplace";

type LocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (location: LocationData) => void;
  initialLocation?: LocationData;
  locale: string;
};

type LocationApiOption = {
  id: number | string;
  name?: string | null;
  name_en?: string | null;
};
type LocationApiResponse<T> = { success?: boolean; data?: T[] };

function toLocationOption(option: LocationApiOption) {
  const id = Number(option.id);
  const name = String(option.name ?? option.name_en ?? "").trim();
  return Number.isFinite(id) && name ? { id, name } : null;
}

async function fetchLocationOptions<T extends LocationApiOption>(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const payload = (await response.json()) as LocationApiResponse<T>;
  return payload.success && Array.isArray(payload.data) ? payload.data : [];
}

export function LocationModal({
  isOpen,
  onClose,
  onSave,
  initialLocation,
  locale,
}: LocationModalProps) {
  const { t } = useTranslation(locale as any);
  const [provinceId, setProvinceId] = useState(initialLocation?.provinceId || "");
  const [districtId, setDistrictId] = useState(initialLocation?.districtId || "");
  const [areaText, setAreaText] = useState(initialLocation?.areaText || "");
  const [streetText, setStreetText] = useState(initialLocation?.streetText || "");
  const [provinces, setProvinces] = useState<Array<{ id: number; name: string }>>([]);
  const [districts, setDistricts] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        const dbRows = (await fetchLocationOptions("/api/location/provinces"))
          .map(toLocationOption)
          .filter((row): row is { id: number; name: string } => Boolean(row));
        const normalizedRows = dbRows.map((row) => ({
          ...row,
          normalized: row.name.trim().toLowerCase(),
        }));

        const ordered = AFGHAN_PROVINCES
          .map((province) => {
            const provinceName = String(province);
            const matched = normalizedRows.find((row) => row.normalized === provinceName.trim().toLowerCase());
            return matched ? { id: matched.id, name: provinceName } : null;
          })
          .filter((value): value is { id: number; name: string } => value !== null);

        setProvinces(ordered);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      }
    };
    loadProvinces();
  }, []);

  useEffect(() => {
    const loadDistricts = async () => {
      if (!provinceId) {
        setDistricts([]);
        return;
      }

      try {
        const rows = (await fetchLocationOptions(
          `/api/location/districts?province_id=${encodeURIComponent(String(provinceId))}`
        ))
          .map(toLocationOption)
          .filter((row): row is { id: number; name: string } => Boolean(row));

        setDistricts(rows);
      } catch (error) {
        console.error("Failed to load districts:", error);
        setDistricts([]);
      }
    };

    void loadDistricts();
  }, [provinceId]);

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
      streetText,
      visibility: "province_district",
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{t("location.title") || "Select Location"}</h2>

        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {t("location.manualOnly") || "Choose the province, district, and optional street details manually."}
        </div>

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
                    {getProvinceLabel(p.name, locale as any)}
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

            <div>
              <label className="block text-sm font-semibold mb-1">
                {t("location.street") || "Street / Avenue / Landmark"} {t("common.optional") || "(Optional)"}
              </label>
              <input
                type="text"
                value={streetText}
                onChange={(e) => setStreetText(e.target.value)}
                placeholder={t("location.streetPlaceholder") || "e.g., Shahr-e Naw Avenue or a nearby landmark"}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
          >
            {t("common.cancel") || "Cancel"}
          </button>
          <button
            onClick={handleSaveManualLocation}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {t("common.save") || "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
