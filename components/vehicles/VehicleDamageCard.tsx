"use client";

import type { AppLocale } from "@/lib/i18n/translations";
import { damageCondition, damagePartLabel } from "@/lib/vehicles/damage-report";

const COPY = {
  en: {
    title: "Painted or Replaced Parts",
    allOriginal: "All body parts are in original factory condition.",
    paintedParts: "Painted Parts",
    changedParts: "Changed Parts",
    noPainted: "No painted parts reported.",
    noChanged: "No changed parts reported.",
  },
  fa: {
    title: "قطعات رنگ‌شده یا تعویض‌شده",
    allOriginal: "فروشنده گزارش داده است که تمام قطعات بدنه در حالت اصلی فابریکه است.",
    paintedParts: "قطعات رنگ‌شده",
    changedParts: "قطعات تعویض‌شده",
    noPainted: "قطعه رنگ‌شده گزارش نشده است.",
    noChanged: "قطعه تعویض‌شده گزارش نشده است.",
  },
  ps: {
    title: "رنګ شوي یا بدل شوي پرزې",
    allOriginal: "پلورونکي راپور ورکړی چې د بدنې ټولې برخې فابریکوي اصلي حالت لري.",
    paintedParts: "رنګ شوي پرزې",
    changedParts: "بدل شوي پرزې",
    noPainted: "رنګ شوې برخه نه ده راپور شوې.",
    noChanged: "بدله شوې برخه نه ده راپور شوې.",
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

  if (allOriginal) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
        <h2 className="text-base font-bold">{copy.title}</h2>
        <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.allOriginal}</p>
      </section>
    );
  }

  const nonOriginal = parts.filter((p) => p.condition !== "original");
  const original = parts.filter((p) => p.condition === "original");
  const paintedParts = parts.filter((p) => p.condition === "painted" || p.condition === "local_painted");
  const changedParts = parts.filter((p) => p.condition === "changed" || p.condition === "replaced");

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <h2 className="text-base font-bold">{copy.title}</h2>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Array.from(new Set(parts.map((part) => part.condition)))
          .filter((key) => key !== "original" || original.length < parts.length)
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

      {/* Compact SVG diagram */}
      <div className="mt-3 flex justify-center">
        <svg viewBox="0 0 220 340" className="w-full max-w-[180px]" aria-label="Vehicle damage overview">
          <rect x={50} y={10} width={120} height={320} rx={20} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} />
          {parts.map((p) => {
            const info = damageCondition(p.condition);
            const coords: Record<string, [number, number, number, number]> = {
              hood:               [60,  15, 100,  55],
              front_bumper:       [55,   8, 110,  18],
              roof:               [62, 114,  96,  55],
              trunk:              [60, 203, 100,  55],
              rear_bumper:        [55, 260, 110,  18],
              front_left_fender:  [20,  22,  38,  38],
              front_right_fender: [162, 22,  38,  38],
              rear_left_fender:   [20, 220,  38,  38],
              rear_right_fender:  [162,220,  38,  38],
              front_left_door:    [18,  72,  40,  68],
              front_right_door:   [162, 72,  40,  68],
              rear_left_door:     [18, 148,  40,  68],
              rear_right_door:    [162,148,  40,  68],
            };
            const c = coords[p.part_key];
            if (!c) return null;
            return (
              <rect
                key={p.part_key}
                x={c[0]} y={c[1]} width={c[2]} height={c[3]}
                rx={3}
                fill={info.color}
                fillOpacity={p.condition === "original" ? 0.3 : 0.7}
                stroke="#374151"
                strokeWidth={0.8}
              />
            );
          })}
        </svg>
      </div>

      {nonOriginal.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
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
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <h3 className="text-sm font-bold">{copy.paintedParts}</h3>
          {paintedParts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-1)]">
              {paintedParts.map((part) => (
                <li key={`painted-${part.part_key}`}>{damagePartLabel(part.part_key, locale) || part.part_label}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.noPainted}</p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <h3 className="text-sm font-bold">{copy.changedParts}</h3>
          {changedParts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-1)]">
              {changedParts.map((part) => (
                <li key={`changed-${part.part_key}`}>{damagePartLabel(part.part_key, locale) || part.part_label}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink-2)]">{copy.noChanged}</p>
          )}
        </div>
      </div>
    </section>
  );
}
