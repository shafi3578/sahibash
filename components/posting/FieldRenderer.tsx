"use client";

import type { PostingFieldSchema } from "@/lib/posting/types";
import { useTranslation } from "@/lib/i18n/client";

type FieldRendererProps = {
  field: PostingFieldSchema;
  value: any;
  onChange: (value: any) => void;
  locale?: string;
};

export function FieldRenderer({
  field,
  value,
  onChange,
  locale = "en",
}: FieldRendererProps) {
  const { t } = useTranslation(locale as any);

  const fieldLabel = t(field.labelKey) || field.labelKey;

  if (field.locked) {
    // Read-only display
    return (
      <div>
        <label className="block text-sm font-semibold mb-1">
          {fieldLabel}
        </label>
        <div className="px-3 py-2 bg-gray-100 border rounded text-gray-700">
          {field.type === "percentage" ? `${value}%` : String(value)}
        </div>
      </div>
    );
  }

  const sharedClasses = "w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div>
      <label className="block text-sm font-semibold mb-1">
        {fieldLabel}
        {field.required && <span className="text-red-500"> *</span>}
      </label>

      {field.type === "text" && (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={sharedClasses}
        />
      )}

      {field.type === "number" && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value || ""}
            onChange={(e) => onChange(Number(e.target.value))}
            min={field.min}
            max={field.max}
            placeholder={field.placeholder}
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {field.unit && <span className="text-sm text-gray-600">{field.unit}</span>}
        </div>
      )}

      {field.type === "percentage" && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={field.min || 0}
            max={field.max || 100}
            value={value || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-sm font-semibold w-12 text-right">{value || 0}%</span>
        </div>
      )}

      {field.type === "select" && (
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={sharedClasses}
        >
          <option value="">
            {field.placeholder || "Select..."}
          </option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey) || opt.labelKey}
            </option>
          ))}
        </select>
      )}

      {field.type === "checkbox" && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">{fieldLabel}</span>
        </label>
      )}

      {field.type === "date" && (
        <input
          type="date"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={sharedClasses}
        />
      )}

      {field.helpText && (
        <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>
      )}
    </div>
  );
}
