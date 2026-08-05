"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import {
  VEHICLE_DAMAGE_CONDITIONS,
  damageCondition,
  damagePartLabel,
  defaultVehicleDamageParts,
  type DamagePart,
  type VehicleDamageCondition,
} from "@/lib/vehicles/damage-report";

export type { DamagePart } from "@/lib/vehicles/damage-report";

const COPY = {
  en: { original: "All body panels are original", help: "Select a panel, then choose its condition. Report paint, replacement, or visible damage honestly.", choose: "Choose panel condition", tap: "Tap any colored body panel to update it.", front: "FRONT", rear: "REAR" },
  fa: { original: "تمام قطعات بدنه اصلی است", help: "یک قطعه را انتخاب کرده و وضعیت آن را تعیین کنید. رنگ، تعویض یا آسیب قابل مشاهده را صادقانه ثبت کنید.", choose: "وضعیت قطعه را انتخاب کنید", tap: "برای تغییر وضعیت، روی هر قطعه رنگی بدنه بزنید.", front: "جلو", rear: "عقب" },
  ps: { original: "د بدنې ټولې برخې اصلي دي", help: "یوه برخه وټاکئ او حالت یې مشخص کړئ. رنګ، بدلون یا ښکاره زیان په رښتینولۍ ثبت کړئ.", choose: "د برخې حالت وټاکئ", tap: "د حالت د بدلولو لپاره په رنګه برخه ټک وکړئ.", front: "مخ", rear: "شا" },
} as const;

const COORDS: Record<string, [number, number, number, number]> = {
  hood: [60, 25, 100, 54], front_bumper: [52, 12, 116, 18], roof: [64, 125, 92, 58],
  trunk: [60, 225, 100, 48], rear_bumper: [52, 276, 116, 18],
  front_left_fender: [20, 36, 38, 44], front_right_fender: [162, 36, 38, 44],
  rear_left_fender: [20, 224, 38, 48], rear_right_fender: [162, 224, 38, 48],
  front_left_door: [18, 92, 40, 62], front_right_door: [162, 92, 40, 62],
  rear_left_door: [18, 158, 40, 62], rear_right_door: [162, 158, 40, 62],
};

function DiagramPart({ part, active, label, onSelect }: { part: DamagePart; active: boolean; label: string; onSelect: () => void }) {
  const coords = COORDS[part.key];
  if (!coords) return null;
  const [x, y, width, height] = coords;
  return (
    <rect
      x={x} y={y} width={width} height={height} rx={7}
      fill={damageCondition(part.condition).color}
      fillOpacity={part.condition === "original" ? 0.45 : 0.88}
      stroke={active ? "#0f172a" : "#475569"}
      strokeWidth={active ? 3 : 1.2}
      className="cursor-pointer transition-opacity hover:opacity-80"
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={label}
    />
  );
}

export function VehicleDamageDiagram({ value, onChange, locale = "en" }: { value: DamagePart[]; onChange: (parts: DamagePart[]) => void; locale?: AppLocale }) {
  const [activePart, setActivePart] = useState<string | null>(null);
  const partMap = useMemo(() => new Map(value.map((part) => [part.key, part])), [value]);
  const allOriginal = value.every((part) => part.condition === "original");

  function setPart(key: string, condition: VehicleDamageCondition) {
    onChange(value.map((part) => part.key === key ? { ...part, condition } : part));
    setActivePart(null);
  }

  return (
    <div className="space-y-3" dir={locale === "en" ? "ltr" : "rtl"}>
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold">
        <input type="checkbox" checked={allOriginal} onChange={(event) => event.target.checked && onChange(defaultVehicleDamageParts())} className="h-4 w-4 accent-[var(--accent)]" />
        {COPY[locale].original}
      </label>
      <p className="text-xs leading-5 text-[var(--ink-2)]">{COPY[locale].help}</p>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b border-[var(--line)] p-3">
          {VEHICLE_DAMAGE_CONDITIONS.map((condition) => (
            <span key={condition.value} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white ${condition.className}`}>
              <span className="h-2 w-2 rounded-full bg-white/70" />{condition.labels[locale]}
            </span>
          ))}
        </div>

        <div className="grid items-center gap-4 p-4 md:grid-cols-[minmax(220px,300px)_1fr]">
          <div className="flex justify-center rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 p-3">
            <svg viewBox="0 0 220 310" className="w-full max-w-[250px]" aria-label="Top view vehicle body condition selector">
              <text x="110" y="9" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">{COPY[locale].front}</text>
              <path d="M61 24 Q70 5 110 5 Q150 5 159 24 L174 62 L174 250 Q160 300 110 304 Q60 300 46 250 L46 62 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="65" y="82" width="90" height="38" rx="9" fill="#bfdbfe" stroke="#64748b" />
              <rect x="65" y="187" width="90" height="32" rx="9" fill="#bfdbfe" stroke="#64748b" />
              <circle cx="39" cy="71" r="10" fill="#334155" /><circle cx="181" cy="71" r="10" fill="#334155" />
              <circle cx="39" cy="239" r="10" fill="#334155" /><circle cx="181" cy="239" r="10" fill="#334155" />
              {value.map((part) => <DiagramPart key={part.key} part={part} active={activePart === part.key} label={damagePartLabel(part.key, locale)} onSelect={() => setActivePart(activePart === part.key ? null : part.key)} />)}
              <text x="110" y="307" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">{COPY[locale].rear}</text>
            </svg>
          </div>

          <div className="space-y-3">
            {activePart ? (
              <>
                <p className="text-sm font-bold">{damagePartLabel(activePart, locale)} — {COPY[locale].choose}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {VEHICLE_DAMAGE_CONDITIONS.map((condition) => {
                    const selected = partMap.get(activePart)?.condition === condition.value;
                    return (
                      <button key={condition.value} type="button" onClick={() => setPart(activePart, condition.value)} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-start text-xs font-bold transition ${selected ? `${condition.className} border-transparent text-white` : "border-[var(--line)] bg-white hover:bg-[var(--surface-2)]"}`}>
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: condition.color }} />{condition.labels[locale]}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : <p className="rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--ink-2)]">{COPY[locale].tap}</p>}

            <div className="grid gap-2 sm:grid-cols-2">
              {value.filter((part) => part.condition !== "original").map((part) => (
                <button key={part.key} type="button" onClick={() => setActivePart(part.key)} className="flex items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-start text-xs">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: damageCondition(part.condition).color }} />
                  <span><strong>{damagePartLabel(part.key, locale)}</strong><br /><span className="text-[var(--ink-2)]">{damageCondition(part.condition).labels[locale]}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function defaultDamageParts(): DamagePart[] {
  return defaultVehicleDamageParts();
}
