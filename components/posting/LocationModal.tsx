"use client";

import { useEffect, useState } from "react";
import type { LocationData } from "@/lib/posting/types";
import { AFGHAN_PROVINCES, getProvinceLabel } from "@/lib/constants/marketplace";
import type { AppLocale } from "@/lib/i18n/translations";

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
  name_fa?: string | null;
  name_ps?: string | null;
};
type LocationApiResponse<T> = { success?: boolean; data?: T[] };

const LOCATION_COPY = {
  en: {
    title: "Select location",
    manualOnly: "Choose the province, district, and optional street or avenue manually.",
    province: "Province",
    district: "District",
    select: "Select...",
    area: "Area",
    areaPlaceholder: "Example: Wazir Akbar Khan",
    street: "Street / Avenue / Landmark",
    streetPlaceholder: "Example: Shahr-e Naw Avenue or a nearby landmark",
    optional: "(Optional)",
    required: "Province and district are required.",
    cancel: "Cancel",
    save: "Save",
  },
  fa: {
    title: "انتخاب موقعیت",
    manualOnly: "ولایت، ولسوالی و نشانی اختیاری سرک یا جاده را به‌صورت دستی انتخاب کنید.",
    province: "ولایت",
    district: "ولسوالی",
    select: "انتخاب کنید...",
    area: "ناحیه یا محله",
    areaPlaceholder: "مثال: وزیر اکبر خان",
    street: "سرک / جاده / نشانی نزدیک",
    streetPlaceholder: "مثال: سرک شهر نو یا یک نشانی نزدیک",
    optional: "(اختیاری)",
    required: "انتخاب ولایت و ولسوالی الزامی است.",
    cancel: "لغو",
    save: "ذخیره",
  },
  ps: {
    title: "ځای وټاکئ",
    manualOnly: "ولایت، ولسوالي او اختیاري سړک یا نږدې نښه په لاسي ډول وټاکئ.",
    province: "ولایت",
    district: "ولسوالي",
    select: "وټاکئ...",
    area: "سیمه یا ګاونډ",
    areaPlaceholder: "بېلګه: د وزیر اکبر خان سیمه",
    street: "سړک / کوڅه / نږدې نښه",
    streetPlaceholder: "بېلګه: د شهر نو سړک یا نږدې نښه",
    optional: "(اختیاري)",
    required: "د ولایت او ولسوالۍ ټاکل اړین دي.",
    cancel: "لغوه",
    save: "خوندي کول",
  },
} as const;

function toLocationOption(option: LocationApiOption, locale: AppLocale) {
  const id = Number(option.id);
  const canonicalName = String(option.name_en ?? option.name ?? "").trim();
  const localizedName = locale === "fa" ? option.name_fa : locale === "ps" ? option.name_ps : option.name_en;
  const name = String(localizedName ?? canonicalName).trim();
  return Number.isFinite(id) && name ? { id, name, canonicalName } : null;
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
  const copy = LOCATION_COPY[locale as AppLocale] ?? LOCATION_COPY.en;
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
          .map((row) => toLocationOption(row, (locale as AppLocale) || "en"))
          .filter((row): row is { id: number; name: string; canonicalName: string } => Boolean(row));
        const normalizedRows = dbRows.map((row) => ({
          ...row,
          normalized: row.canonicalName.trim().toLowerCase(),
        }));

        const ordered = AFGHAN_PROVINCES
          .map((province) => {
            const provinceName = String(province);
            const matched = normalizedRows.find((row) => row.normalized === provinceName.trim().toLowerCase());
            return matched ? { id: matched.id, name: matched.name } : null;
          })
          .filter((value): value is { id: number; name: string } => value !== null);

        setProvinces(ordered);
      } catch (error) {
        console.error("Failed to load provinces:", error);
      }
    };
    loadProvinces();
  }, [locale]);

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
          .map((row) => toLocationOption(row, (locale as AppLocale) || "en"))
          .filter((row): row is { id: number; name: string; canonicalName: string } => Boolean(row));

        setDistricts(rows);
      } catch (error) {
        console.error("Failed to load districts:", error);
        setDistricts([]);
      }
    };

    void loadDistricts();
  }, [locale, provinceId]);

  const handleSaveManualLocation = () => {
    if (!provinceId || !districtId) {
      alert(copy.required);
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
        <h2 className="text-xl font-bold mb-4">{copy.title}</h2>

        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          {copy.manualOnly}
        </div>

        <div className="space-y-4">
            {/* Province */}
            <div>
              <label className="block text-sm font-semibold mb-1">
                {copy.province} *
              </label>
              <select
                value={provinceId}
                onChange={(e) => setProvinceId(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{copy.select}</option>
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
                {copy.district} *
              </label>
              <select
                value={districtId}
                onChange={(e) => setDistrictId(e.target.value)}
                disabled={!provinceId}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">{copy.select}</option>
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
                {copy.area} {copy.optional}
              </label>
              <input
                type="text"
                value={areaText}
                onChange={(e) => setAreaText(e.target.value)}
                placeholder={copy.areaPlaceholder}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">
                {copy.street} {copy.optional}
              </label>
              <input
                type="text"
                value={streetText}
                onChange={(e) => setStreetText(e.target.value)}
                placeholder={copy.streetPlaceholder}
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
            {copy.cancel}
          </button>
          <button
            onClick={handleSaveManualLocation}
            className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            {copy.save}
          </button>
        </div>
      </div>
    </div>
  );
}
