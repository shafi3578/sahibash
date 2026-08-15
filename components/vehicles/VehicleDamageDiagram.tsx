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

type PanelGeometry =
  | { kind: "path"; d: string }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number };

const PANEL_GEOMETRY: Record<string, PanelGeometry> = {
  front_bumper: { kind: "rect", x: 151, y: 8, width: 118, height: 27, rx: 5 },
  hood: { kind: "path", d: "M158 55 Q210 39 262 55 L255 137 Q210 126 165 137 Z" },
  roof: { kind: "path", d: "M169 205 L251 205 L249 289 Q210 300 171 289 Z" },
  trunk: { kind: "path", d: "M168 316 Q210 328 252 316 L260 371 Q210 389 160 371 Z" },
  rear_bumper: { kind: "rect", x: 151, y: 397, width: 118, height: 27, rx: 5 },
  front_left_fender: { kind: "path", d: "M31 58 L91 58 L126 137 L108 151 L73 137 L31 133 Z" },
  front_right_fender: { kind: "path", d: "M389 58 L329 58 L294 137 L312 151 L347 137 L389 133 Z" },
  front_left_door: { kind: "path", d: "M31 145 L72 143 L111 158 L116 218 L31 203 Z" },
  front_right_door: { kind: "path", d: "M389 145 L348 143 L309 158 L304 218 L389 203 Z" },
  rear_left_door: { kind: "path", d: "M31 215 L116 230 L111 288 L72 304 L31 302 Z" },
  rear_right_door: { kind: "path", d: "M389 215 L304 230 L309 288 L348 304 L389 302 Z" },
  rear_left_fender: { kind: "path", d: "M31 314 L73 310 L108 296 L126 310 L91 376 L31 376 Z" },
  rear_right_fender: { kind: "path", d: "M389 314 L347 310 L312 296 L294 310 L329 376 L389 376 Z" },
};

function DiagramPart({ part, active, label, onSelect }: { part: DamagePart; active: boolean; label: string; onSelect: () => void }) {
  const geometry = PANEL_GEOMETRY[part.key];
  if (!geometry) return null;
  const condition = damageCondition(part.condition);
  return (
    <g
      fill={condition.color}
      fillOpacity={part.condition === "original" ? 0.38 : 0.9}
      stroke={active ? "#0f172a" : "#475569"}
      strokeWidth={active ? 4 : 1.5}
      className="cursor-pointer transition-opacity hover:opacity-80 focus:outline-none"
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
    >
      <title>{label}: {condition.labels.en}</title>
      {geometry.kind === "path" ? (
        <path d={geometry.d} vectorEffect="non-scaling-stroke" />
      ) : (
        <rect x={geometry.x} y={geometry.y} width={geometry.width} height={geometry.height} rx={geometry.rx} vectorEffect="non-scaling-stroke" />
      )}
    </g>
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

        <div className="grid items-center gap-5 p-4 md:grid-cols-[minmax(280px,410px)_1fr] md:p-5">
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-[#faf8ef] p-3 shadow-inner sm:p-5">
            <svg viewBox="0 0 420 432" className="w-full max-w-[420px]" aria-label="Exploded top view vehicle body condition selector">
              <text x="210" y="7" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="2" fill="#64748b">{COPY[locale].front}</text>

              <path d="M157 52 Q210 36 263 52 L266 140 Q270 171 263 202 L257 292 Q263 320 260 375 Q210 394 160 375 Q157 320 163 292 L157 202 Q150 171 154 140 Z" fill="#fff" stroke="#d7dce3" strokeWidth="4" />
              <path d="M165 140 Q210 127 255 140 L250 196 Q210 185 170 196 Z" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />
              <path d="M171 291 Q210 303 249 291 L253 315 Q210 325 167 315 Z" fill="#fff" stroke="#e5e7eb" strokeWidth="2" />

              {value.map((part) => <DiagramPart key={part.key} part={part} active={activePart === part.key} label={damagePartLabel(part.key, locale)} onSelect={() => setActivePart(activePart === part.key ? null : part.key)} />)}
              <g fill="#d1d5db" stroke="#f3f4f6" strokeWidth="3" pointerEvents="none">
                <circle cx="24" cy="111" r="23" /><circle cx="396" cy="111" r="23" />
                <circle cx="24" cy="325" r="23" /><circle cx="396" cy="325" r="23" />
              </g>
              <g fill="#d1d5db" stroke="#f8fafc" strokeWidth="2" pointerEvents="none">
                <circle cx="24" cy="111" r="11" /><circle cx="396" cy="111" r="11" />
                <circle cx="24" cy="325" r="11" /><circle cx="396" cy="325" r="11" />
              </g>
              <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5">
                <rect x="160" y="16" width="22" height="8" rx="3" fill="#fff" /><rect x="238" y="16" width="22" height="8" rx="3" fill="#fff" />
                <rect x="160" y="406" width="22" height="8" rx="3" fill="#fff" /><rect x="238" y="406" width="22" height="8" rx="3" fill="#fff" />
              </g>
              <text x="210" y="431" textAnchor="middle" fontSize="9" fontWeight="800" letterSpacing="2" fill="#64748b">{COPY[locale].rear}</text>
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
