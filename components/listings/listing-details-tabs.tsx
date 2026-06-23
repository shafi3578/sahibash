"use client";

import { useMemo, useState } from "react";

type Attr = {
  key: string;
  label: string;
  value: string;
  group: string;
};

type Props = {
  basicRows: Array<{ label: string; value: string }>;
  grouped: Record<string, Attr[]>;
  description: string;
  location: string;
};

const GROUP_ORDER = [
  "property_details",
  "category_specific",
  "interior_features",
  "exterior_features",
  "location_nearby",
  "transportation",
  "view",
  "utilities",
] as const;

const GROUP_LABELS: Record<string, string> = {
  property_details: "Property Details",
  category_specific: "Category Specific",
  interior_features: "Interior Features",
  exterior_features: "Exterior Features",
  location_nearby: "Location & Nearby Places",
  transportation: "Transportation",
  view: "View",
  utilities: "Utilities",
};

export function ListingDetailsTabs({ basicRows, grouped, description, location }: Props) {
  const [tab, setTab] = useState<"details" | "description" | "location">("details");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    property_details: true,
    category_specific: true,
  });

  const groupsToRender = useMemo(() => {
    return GROUP_ORDER.filter((key) => (grouped[key] ?? []).length > 0);
  }, [grouped]);

  return (
    <div className="mt-4 rounded-2xl border border-[var(--line)] bg-white">
      <div className="grid grid-cols-3 border-b border-[var(--line)]">
        <TabButton active={tab === "details"} label="Property Details" onClick={() => setTab("details")} />
        <TabButton active={tab === "description"} label="Description" onClick={() => setTab("description")} />
        <TabButton active={tab === "location"} label="Location" onClick={() => setTab("location")} />
      </div>

      {tab === "details" ? (
        <div className="p-3 sm:p-4">
          <div className="overflow-hidden rounded-xl border border-[var(--line)]">
            {basicRows.map((row) => (
              <div key={row.label} className="grid grid-cols-[1fr_auto] gap-3 border-b border-[var(--line)] px-3 py-2 text-sm last:border-b-0">
                <p className="text-[var(--ink-2)]">{row.label}</p>
                <p className="max-w-[58vw] break-words text-right font-semibold text-[var(--ink-1)] sm:max-w-none">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            {groupsToRender.map((groupKey) => {
              const attrs = grouped[groupKey] ?? [];
              const open = openGroups[groupKey] ?? false;
              return (
                <section key={groupKey} className="overflow-hidden rounded-xl border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => setOpenGroups((prev) => ({ ...prev, [groupKey]: !open }))}
                    className="flex w-full items-center justify-between bg-[var(--surface-2)] px-3 py-2 text-left"
                  >
                    <span className="text-sm font-semibold">{GROUP_LABELS[groupKey] ?? groupKey}</span>
                    <span className="text-xl leading-none">{open ? "−" : "+"}</span>
                  </button>
                  {open ? (
                    <div>
                      {attrs.map((attr) => (
                        <div key={`${groupKey}-${attr.key}`} className="grid grid-cols-[1fr_auto] gap-3 border-t border-[var(--line)] px-3 py-2 text-sm">
                          <p className="text-[var(--ink-2)]">{attr.label}</p>
                          <p className="max-w-[58vw] break-words text-right font-semibold text-[var(--ink-1)] sm:max-w-none">{attr.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === "description" ? (
        <div className="p-4">
          <p className="whitespace-pre-line text-sm leading-6 text-[var(--ink-1)]">{description}</p>
        </div>
      ) : null}

      {tab === "location" ? (
        <div className="p-4">
          <p className="text-sm font-semibold text-[var(--ink-1)]">{location}</p>
          <p className="mt-2 text-sm text-[var(--ink-2)]">Map integration can be connected in the next step.</p>
        </div>
      ) : null}
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-sm font-semibold ${active ? "bg-[var(--brand)] text-[var(--ink-1)]" : "bg-white text-[var(--ink-2)]"}`}
    >
      {label}
    </button>
  );
}
