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
  front_bumper: { kind: "rect", x: 145, y: 18, width: 130, height: 30, rx: 9 },
  hood: { kind: "path", d: "M155 70 Q210 45 265 70 L256 182 Q210 164 164 182 Z" },
  roof: { kind: "path", d: "M164 208 Q210 188 256 208 L253 350 Q210 370 167 350 Z" },
  trunk: { kind: "path", d: "M167 374 Q210 390 253 374 L262 472 Q210 496 158 472 Z" },
  rear_bumper: { kind: "rect", x: 145, y: 510, width: 130, height: 30, rx: 9 },
  front_left_fender: { kind: "path", d: "M34 70 L96 70 L126 180 L111 197 L75 172 L34 166 Z" },
  front_right_fender: { kind: "path", d: "M386 70 L324 70 L294 180 L309 197 L345 172 L386 166 Z" },
  front_left_door: { kind: "path", d: "M34 181 L76 177 L113 204 L114 282 L34 264 Z" },
  front_right_door: { kind: "path", d: "M386 181 L344 177 L307 204 L306 282 L386 264 Z" },
  rear_left_door: { kind: "path", d: "M34 277 L114 295 L113 372 L76 399 L34 395 Z" },
  rear_right_door: { kind: "path", d: "M386 277 L306 295 L307 372 L344 399 L386 395 Z" },
  rear_left_fender: { kind: "path", d: "M34 410 L75 404 L111 379 L126 396 L96 480 L34 480 Z" },
  rear_right_fender: { kind: "path", d: "M386 410 L345 404 L309 379 L294 396 L324 480 L386 480 Z" },
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
            <svg viewBox="0 0 420 558" className="w-full max-w-[390px]" aria-label="Exploded top view vehicle body condition selector">
              <text x="210" y="11" textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="2" fill="#64748b">{COPY[locale].front}</text>

              <path d="M153 64 Q210 38 267 64 L276 189 Q278 230 274 278 L270 371 Q272 425 266 480 Q210 509 154 480 Q148 425 150 371 L146 278 Q142 230 144 189 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
              <path d="M165 188 Q210 169 255 188 L250 219 Q210 202 170 219 Z" fill="#dbeafe" stroke="#94a3b8" strokeWidth="1.5" />
              <path d="M169 354 Q210 374 251 354 L255 383 Q210 402 165 383 Z" fill="#dbeafe" stroke="#94a3b8" strokeWidth="1.5" />

              {value.map((part) => <DiagramPart key={part.key} part={part} active={activePart === part.key} label={damagePartLabel(part.key, locale)} onSelect={() => setActivePart(activePart === part.key ? null : part.key)} />)}
              <g fill="#334155" stroke="#0f172a" strokeWidth="2" pointerEvents="none">
                <circle cx="25" cy="140" r="23" /><circle cx="395" cy="140" r="23" />
                <circle cx="25" cy="410" r="23" /><circle cx="395" cy="410" r="23" />
              </g>
              <g fill="#94a3b8" pointerEvents="none">
                <circle cx="25" cy="140" r="11" /><circle cx="395" cy="140" r="11" />
                <circle cx="25" cy="410" r="11" /><circle cx="395" cy="410" r="11" />
              </g>
              <g fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1.5">
                <rect x="159" y="24" width="24" height="9" rx="3" /><rect x="237" y="24" width="24" height="9" rx="3" />
                <rect x="159" y="518" width="24" height="9" rx="3" /><rect x="237" y="518" width="24" height="9" rx="3" />
              </g>
              <text x="210" y="555" textAnchor="middle" fontSize="10" fontWeight="800" letterSpacing="2" fill="#64748b">{COPY[locale].rear}</text>
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
