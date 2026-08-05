"use client";

import {
  Lang, getLeafById, getFieldLabel, getOptionLabel, localizeDigits,
} from "@/data/electronics-categories";

interface Props {
  leafId: string;
  lang: Lang;
  attributes: Record<string, unknown>; // saved ad attributes from API
  features?: string[];             // saved feature keys
}

export default function DynamicDetailSection({ leafId, lang, attributes, features = [] }: Props) {
  const leaf = getLeafById(leafId);
  if (!leaf) return null;

  const displayValue = (key: string): string | null => {
    const field = leaf.fields.find((f) => f.key === key);
    if (!field) return null;
    const raw = attributes[key];
    const other = attributes[`${key}_other`];
    if (other) return String(other);
    if (raw === undefined || raw === null || raw === "") return null;
    if (Array.isArray(raw)) {
      return raw.map((v) => getOptionLabel(field, String(v), lang)).join(lang === "en" ? ", " : "، ");
    }
    const label =
      field.type === "select" || field.type === "cascading-select" || field.type === "multi-select"
        ? getOptionLabel(field, String(raw), lang)
        : String(raw);
    const withUnit = field.unit ? `${label} ${field.unit[lang]}` : label;
    return localizeDigits(withUnit, lang);
  };

  // Top 4 stat cards
  const topCards = leaf.topCards
    .map((key) => ({
      key,
      label: getFieldLabel(leaf, key, lang),
      value: displayValue(key),
    }))
    .filter((c) => c.value);

  // Details table = all fields not already in top cards (values only)
  const tableRows = leaf.fields
    .filter((f) => f.key !== "location" || true) // location stays in table
    .map((f) => ({
      key: f.key,
      label: f.labels[lang],
      value: displayValue(f.key),
    }))
    .filter((r) => r.value);

  const featureDefs = leaf.features.filter((f) => features.includes(f.key));

  return (
    <>
      {/* ===== TOP 4 STAT CARDS (existing card styles) ===== */}
      {topCards.length > 0 && (
        <div className="stat-cards-grid">
          {topCards.slice(0, 4).map((card) => (
            <div className="stat-card" key={card.key}>
              <span className="stat-label">{card.label}</span>
              <span className="stat-value">{card.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ===== DETAILS TABLE (existing table styles) ===== */}
      <div className="details-card">
        <h3 className="details-title">
          {lang === "en" ? "Details" : lang === "fa" ? "جزئیات" : "تفصیلات"}
        </h3>
        <div className="details-table">
          {tableRows.map((row) => (
            <div className="details-row" key={row.key}>
              <span className="details-label">{row.label}</span>
              <span className="details-value">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FEATURE CHIPS (existing chip styles) ===== */}
      {featureDefs.length > 0 && (
        <div className="features-card">
          <h3 className="features-title">
            {lang === "en" ? "Features" : lang === "fa" ? "ویژگی‌ها" : "ځانګړتیاوې"}
          </h3>
          <div className="feature-chips">
            {featureDefs.map((f) => (
              <span className="feature-chip" key={f.key}>
                ✓ {f.labels[lang]}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
