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
import { VehicleBodyDiagram } from "@/components/vehicles/VehicleBodyDiagram";

export type { DamagePart } from "@/lib/vehicles/damage-report";

const COPY = {
  en: { original: "All body panels are original", help: "Select a panel, then mark it as original, painted, repaired, replaced, or damaged.", choose: "Choose panel condition", tap: "Tap a body panel to update it." },
  fa: { original: "تمام قطعات بدنه اصلی است", help: "یک قطعه را انتخاب کرده و آن را اصلی، رنگ‌شده، ترمیم‌شده، تعویض‌شده یا آسیب‌دیده ثبت کنید.", choose: "وضعیت قطعه را انتخاب کنید", tap: "برای تغییر وضعیت، روی یک قطعه بدنه بزنید." },
  ps: { original: "د بدنې ټولې برخې اصلي دي", help: "یوه برخه وټاکئ او اصلي، رنګ شوې، ترمیم شوې، بدله شوې یا زیانمنه یې وښایئ.", choose: "د برخې حالت وټاکئ", tap: "د حالت د بدلولو لپاره د بدنې پر یوې برخې ټک وکړئ." },
} as const;

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
          <div className="flex justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-[#fffdf5] to-[#f4f7fa] p-3 shadow-inner sm:p-5">
            <VehicleBodyDiagram
              parts={value}
              locale={locale}
              activePart={activePart}
              onSelect={(key) => setActivePart(activePart === key ? null : key)}
            />
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
