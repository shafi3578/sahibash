"use client";

import React from "react";
import {
  FieldDef, LeafSubcategory, Lang, getLeafById, localizeDigits,
} from "@/data/electronics-categories";

interface Props {
  leafId: string;                     // selected subcategory id
  lang: Lang;                         // current locale
  values: Record<string, any>;        // your existing form state slice
  onChange: (key: string, value: any) => void; // your existing setter
}

const OTHER_VALUE = "other";

export default function DynamicCategoryFields({ leafId, lang, values, onChange }: Props) {
  const leaf = getLeafById(leafId);
  if (!leaf) return null;

  const handleParentChange = (field: FieldDef, value: string) => {
    onChange(field.key, value);
    // reset all children that depend on this field
    leaf.fields
      .filter((f) => f.dependsOn === field.key)
      .forEach((child) => {
        onChange(child.key, "");
        onChange(`${child.key}_other`, "");
      });
    onChange(`${field.key}_other`, "");
  };

  const renderField = (field: FieldDef) => {
    const value = values[field.key] ?? "";
    const label = field.labels[lang];
    const isOther = value === OTHER_VALUE;

    switch (field.type) {
      case "select": {
        return (
          <div key={field.key} className="form-field">
            <label>
              {label} {field.required && <span className="req">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleParentChange(field, e.target.value)}
              required={field.required}
            >
              <option value="">--</option>
              {field.options?.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.labels[lang]}
                </option>
              ))}
            </select>
            {field.allowOther && isOther && (
              <input
                type="text"
                value={values[`${field.key}_other`] ?? ""}
                onChange={(e) => onChange(`${field.key}_other`, e.target.value)}
                placeholder={
                  lang === "en" ? "Enter manually" :
                  lang === "fa" ? "به صورت دستی بنویسید" : "په لاسي ډول ولیکئ"
                }
              />
            )}
          </div>
        );
      }

      case "cascading-select": {
        const parentValue = values[field.dependsOn!] ?? "";
        const options = field.optionsByParent?.[parentValue] ?? [];
        const showFreeText =
          isOther || (parentValue && options.length === 0) || parentValue === OTHER_VALUE;

        return (
          <div key={field.key} className="form-field">
            <label>
              {label} {field.required && <span className="req">*</span>}
            </label>
            {options.length > 0 && (
              <select
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
                required={field.required && !showFreeText}
                disabled={!parentValue}
              >
                <option value="">--</option>
                {options.map((op) => (
                  <option key={op.value} value={op.value}>
                    {op.labels[lang]}
                  </option>
                ))}
                {field.allowOther && (
                  <option value={OTHER_VALUE}>
                    {lang === "en" ? "Other" : lang === "fa" ? "دیگر" : "نور"}
                  </option>
                )}
              </select>
            )}
            {showFreeText && (
              <input
                type="text"
                value={values[`${field.key}_other`] ?? (options.length === 0 ? value : "")}
                onChange={(e) =>
                  options.length === 0
                    ? onChange(field.key, e.target.value)
                    : onChange(`${field.key}_other`, e.target.value)
                }
                placeholder={
                  lang === "en" ? "Enter model manually" :
                  lang === "fa" ? "مدل را دستی بنویسید" : "ماډل په لاسي ډول ولیکئ"
                }
              />
            )}
          </div>
        );
      }

      case "multi-select": {
        const selected: string[] = Array.isArray(value) ? value : [];
        return (
          <div key={field.key} className="form-field">
            <label>
              {label} {field.required && <span className="req">*</span>}
            </label>
            <div className="chip-group">
              {field.options?.map((op) => {
                const active = selected.includes(op.value);
                return (
                  <button
                    type="button"
                    key={op.value}
                    className={`chip ${active ? "chip-active" : ""}`}
                    onClick={() =>
                      onChange(
                        field.key,
                        active
                          ? selected.filter((v) => v !== op.value)
                          : [...selected, op.value]
                      )
                    }
                  >
                    {op.labels[lang]}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case "number":
        return (
          <div key={field.key} className="form-field">
            <label>
              {label} {field.required && <span className="req">*</span>}
              {field.unit && <span className="unit"> ({field.unit[lang]})</span>}
            </label>
            <input
              type="number"
              inputMode="numeric"
              value={value}
              min={field.min}
              max={field.max}
              required={field.required}
              onChange={(e) => onChange(field.key, e.target.value)}
            />
          </div>
        );

      case "text":
      case "textarea": {
        const Tag = field.type === "textarea" ? "textarea" : "input";
        return (
          <div key={field.key} className="form-field">
            <label>
              {label} {field.required && <span className="req">*</span>}
            </label>
            <Tag
              type="text"
              value={value}
              required={field.required}
              placeholder={field.placeholder?.[lang]}
              onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                onChange(field.key, e.target.value)
              }
            />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="dynamic-fields" dir={lang === "en" ? "ltr" : "rtl"}>
      {leaf.fields.map((field) => renderField(field))}

      {leaf.features.length > 0 && (
        <div className="form-field">
          <label>
            {lang === "en" ? "Features" : lang === "fa" ? "ویژگی‌ها" : "ځانګړتیاوې"}
          </label>
          <div className="chip-group">
            {leaf.features.map((feat) => {
              const selected: string[] = Array.isArray(values.features)
                ? values.features
                : [];
              const active = selected.includes(feat.key);
              return (
                <button
                  type="button"
                  key={feat.key}
                  className={`chip ${active ? "chip-active" : ""}`}
                  onClick={() =>
                    onChange(
                      "features",
                      active
                        ? selected.filter((v) => v !== feat.key)
                        : [...selected, feat.key]
                    )
                  }
                >
                  {feat.labels[lang]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}