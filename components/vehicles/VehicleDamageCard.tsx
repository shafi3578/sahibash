"use client";

import type { AppLocale } from "@/lib/i18n/translations";
import { damageCondition, damagePartLabel } from "@/lib/vehicles/damage-report";
import { VehicleBodyDiagram } from "@/components/vehicles/VehicleBodyDiagram";

const COPY = {
  en: {
    title: "Seller vehicle body report",
    allOriginal: "All body parts are in original factory condition.",
    summary: "Reported body-part conditions",
  },
  fa: {
    title: "گزارش وضعیت بدنه فروشنده",
    allOriginal: "فروشنده گزارش داده است که تمام قطعات بدنه در حالت اصلی فابریکه است.",
    summary: "وضعیت گزارش‌شده قطعات بدنه",
  },
  ps: {
    title: "د پلورونکي د موټر د بدنې راپور",
    allOriginal: "پلورونکي راپور ورکړی چې د بدنې ټولې برخې فابریکوي اصلي حالت لري.",
    summary: "د بدنې د برخو راپور شوی حالت",
  },
} as const satisfies Record<AppLocale, Record<string, string>>;

type DamagePart = { part_key: string; part_label: string; condition: string };

type Props = {
  allOriginal: boolean;
  parts: DamagePart[];
  locale?: AppLocale;
};

export function VehicleDamageCard({ allOriginal, parts, locale = "en" }: Props) {
  const copy = COPY[locale] ?? COPY.en;

  const nonOriginal = parts.filter((p) => p.condition !== "original");
  const diagramParts = parts.map((part) => ({ key: part.part_key, condition: part.condition }));

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <h2 className="text-base font-bold">{copy.title}</h2>
      {allOriginal ? <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.allOriginal}</p> : null}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from(new Set(parts.map((part) => part.condition)))
          .map((key) => {
            const info = damageCondition(key);
            return (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: info.color }}
            >
              {info.labels[locale]}
            </span>
            );
          })}
      </div>

      <div className="mt-4 flex justify-center rounded-2xl border border-slate-200 bg-gradient-to-b from-[#fffdf5] to-[#f4f7fa] p-3 shadow-inner sm:p-5">
        <VehicleBodyDiagram parts={diagramParts} locale={locale} compact />
      </div>

      {nonOriginal.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold">{copy.summary}</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {nonOriginal.map((p) => {
            const info = damageCondition(p.condition);
            return (
              <div key={p.part_key} className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1.5 text-xs">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: info.color }} />
                <div>
                  <p className="font-semibold">{damagePartLabel(p.part_key, locale) || p.part_label}</p>
                  <p className="text-[var(--ink-2)]">{info.labels[locale]}</p>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}
    </section>
  );
}
