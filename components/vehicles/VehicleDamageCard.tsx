"use client";

const CONDITIONS: Record<string, { label: string; color: string }> = {
  original:      { label: "Original",         color: "#6b7280" },
  local_painted: { label: "Locally Painted", color: "#ea580c" },
  painted:       { label: "Painted",         color: "#2563eb" },
  changed:       { label: "Changed",         color: "#dc2626" },
  replaced:      { label: "Changed",         color: "#dc2626" },
};

type DamagePart = { part_key: string; part_label: string; condition: string };

type Props = {
  allOriginal: boolean;
  parts: DamagePart[];
};

export function VehicleDamageCard({ allOriginal, parts }: Props) {
  if (allOriginal) {
    return (
      <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
        <h2 className="text-base font-bold">Painted or Replaced Parts</h2>
        <p className="mt-2 text-sm text-[var(--ink-2)]">All body parts are in original factory condition.</p>
      </section>
    );
  }

  const nonOriginal = parts.filter((p) => p.condition !== "original");
  const original = parts.filter((p) => p.condition === "original");
  const paintedParts = parts.filter((p) => p.condition === "painted" || p.condition === "local_painted");
  const changedParts = parts.filter((p) => p.condition === "changed" || p.condition === "replaced");

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-white p-4 sm:p-5">
      <h2 className="text-base font-bold">Painted or Replaced Parts</h2>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(CONDITIONS)
          .filter(([key]) => key !== "original" || original.length < parts.length)
          .map(([key, info]) => (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: info.color }}
            >
              {info.label}
            </span>
          ))}
      </div>

      {/* Compact SVG diagram */}
      <div className="mt-3 flex justify-center">
        <svg viewBox="0 0 220 340" className="w-full max-w-[180px]" aria-label="Vehicle damage overview">
          <rect x={50} y={10} width={120} height={320} rx={20} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} />
          {parts.map((p) => {
            const info = CONDITIONS[p.condition] ?? CONDITIONS.original;
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
            const info = CONDITIONS[p.condition];
            return (
              <div key={p.part_key} className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2 py-1.5 text-xs">
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: info?.color ?? "#6b7280" }} />
                <div>
                  <p className="font-semibold">{p.part_label}</p>
                  <p className="text-[var(--ink-2)]">{info?.label ?? p.condition}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <h3 className="text-sm font-bold">Painted Parts</h3>
          {paintedParts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-1)]">
              {paintedParts.map((part) => (
                <li key={`painted-${part.part_key}`}>{part.part_label}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink-2)]">No painted parts reported.</p>
          )}
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
          <h3 className="text-sm font-bold">Changed Parts</h3>
          {changedParts.length > 0 ? (
            <ul className="mt-2 space-y-1 text-sm text-[var(--ink-1)]">
              {changedParts.map((part) => (
                <li key={`changed-${part.part_key}`}>{part.part_label}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[var(--ink-2)]">No changed parts reported.</p>
          )}
        </div>
      </div>
    </section>
  );
}
