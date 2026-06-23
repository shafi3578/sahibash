"use client";

import { useMemo, useState } from "react";

const PARTS = [
  { key: "hood",               label: "Hood",               group: "top" },
  { key: "roof",               label: "Roof",               group: "top" },
  { key: "trunk",              label: "Trunk",              group: "top" },
  { key: "front_bumper",       label: "Front Bumper",       group: "front_rear" },
  { key: "rear_bumper",        label: "Rear Bumper",        group: "front_rear" },
  { key: "front_left_fender",  label: "Front Left Fender",  group: "fender" },
  { key: "front_right_fender", label: "Front Right Fender", group: "fender" },
  { key: "rear_left_fender",   label: "Rear Left Fender",   group: "fender" },
  { key: "rear_right_fender",  label: "Rear Right Fender",  group: "fender" },
  { key: "front_left_door",    label: "Front Left Door",    group: "door" },
  { key: "front_right_door",   label: "Front Right Door",   group: "door" },
  { key: "rear_left_door",     label: "Rear Left Door",     group: "door" },
  { key: "rear_right_door",    label: "Rear Right Door",    group: "door" },
] as const;

const CONDITIONS = [
  { value: "original",       label: "Original",       color: "#6b7280", bg: "bg-gray-500",  ring: "ring-gray-400" },
  { value: "local_painted",  label: "Locally Painted", color: "#ea580c", bg: "bg-orange-500", ring: "ring-orange-400" },
  { value: "painted",        label: "Painted",        color: "#2563eb", bg: "bg-blue-500",  ring: "ring-blue-400" },
  { value: "changed",        label: "Changed",        color: "#dc2626", bg: "bg-red-500",   ring: "ring-red-400" },
] as const;

export type DamagePart = { key: string; label: string; condition: string };

type Props = {
  value: DamagePart[];
  onChange: (parts: DamagePart[]) => void;
};

function conditionColor(cond: string) {
  return CONDITIONS.find((c) => c.value === cond)?.color ?? CONDITIONS[0].color;
}

function DiagramPart({
  partKey, x, y, w, h, label, activePart, onTap, getCondition,
}: {
  partKey: string; x: number; y: number; w: number; h: number; label: string;
  activePart: string | null; onTap: (key: string | null) => void;
  getCondition: (key: string) => string;
}) {
  const cond = getCondition(partKey);
  const color = conditionColor(cond);
  const isActive = activePart === partKey;
  return (
    <g onClick={() => onTap(isActive ? null : partKey)} className="cursor-pointer" role="button" aria-label={label}>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={color} fillOpacity={0.75}
        stroke={isActive ? "#1d4ed8" : "#374151"} strokeWidth={isActive ? 2.5 : 1.2} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize={8} fill="#fff"
        fontWeight="600" pointerEvents="none">
        {label}
      </text>
    </g>
  );
}

export function VehicleDamageDiagram({ value, onChange }: Props) {
  const [activePart, setActivePart] = useState<string | null>(null);
  const allOriginal = value.every((p) => p.condition === "original");

  const partMap = useMemo(() => {
    return new Map(value.map((p) => [p.key, p.condition]));
  }, [value]);

  function setPart(key: string, condition: string) {
    const next = value.map((p) => (p.key === key ? { ...p, condition } : p));
    onChange(next);
    setActivePart(null);
  }

  function setAllOriginal() {
    onChange(value.map((p) => ({ ...p, condition: "original" })));
    setActivePart(null);
  }

  function getCondition(key: string) {
    return partMap.get(key) ?? "original";
  }

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold">
        <input
          type="checkbox"
          checked={allOriginal}
          onChange={(e) => {
            if (e.target.checked) setAllOriginal();
          }}
          className="h-4 w-4 accent-[var(--accent)]"
        />
        All parts are original (factory condition)
      </label>

      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        <div className="flex flex-wrap gap-2 border-b border-[var(--line)] px-3 py-2">
          {CONDITIONS.map((c) => (
            <span
              key={c.value}
              className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold text-white ${c.bg}`}
            >
              <span className="h-2 w-2 rounded-full bg-white/60" />
              {c.label}
            </span>
          ))}
        </div>

        <div className="flex justify-center p-3">
          <svg
            viewBox="0 0 220 340"
            className="w-full max-w-[220px]"
            style={{ maxHeight: 340 }}
            aria-label="Vehicle damage diagram"
          >
            {/* Car body outline */}
            <rect x={50} y={10} width={120} height={320} rx={20} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={1.5} />

            {/* Hood */}
            <DiagramPart partKey="hood"  x={60} y={15}  w={100} h={55} label="Hood" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Front bumper */}
            <DiagramPart partKey="front_bumper" x={55} y={8}  w={110} h={18} label="Front Bumper" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Windshield area — non-interactive */}
            <rect x={62} y={72} width={96} height={40} rx={4} fill="#cbd5e1" stroke="#64748b" strokeWidth={1} />
            <text x={110} y={96} textAnchor="middle" fontSize={7} fill="#475569" fontWeight="500">Windshield</text>
            {/* Roof */}
            <DiagramPart partKey="roof" x={62} y={114} w={96} h={55} label="Roof" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Rear windshield area */}
            <rect x={62} y={171} width={96} height={30} rx={4} fill="#cbd5e1" stroke="#64748b" strokeWidth={1} />
            <text x={110} y={190} textAnchor="middle" fontSize={7} fill="#475569" fontWeight="500">Rear Glass</text>
            {/* Trunk */}
            <DiagramPart partKey="trunk" x={60} y={203} w={100} h={55} label="Trunk" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Rear bumper */}
            <DiagramPart partKey="rear_bumper" x={55} y={260} w={110} h={18} label="Rear Bumper" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />

            {/* Front left fender */}
            <DiagramPart partKey="front_left_fender" x={20} y={22} w={38} h={38} label="FL Fender" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Front right fender */}
            <DiagramPart partKey="front_right_fender" x={162} y={22} w={38} h={38} label="FR Fender" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Rear left fender */}
            <DiagramPart partKey="rear_left_fender" x={20} y={220} w={38} h={38} label="RL Fender" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Rear right fender */}
            <DiagramPart partKey="rear_right_fender" x={162} y={220} w={38} h={38} label="RR Fender" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />

            {/* Front left door */}
            <DiagramPart partKey="front_left_door" x={18} y={72} w={40} h={68} label="FL Door" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Front right door */}
            <DiagramPart partKey="front_right_door" x={162} y={72} w={40} h={68} label="FR Door" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Rear left door */}
            <DiagramPart partKey="rear_left_door" x={18} y={148} w={40} h={68} label="RL Door" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
            {/* Rear right door */}
            <DiagramPart partKey="rear_right_door" x={162} y={148} w={40} h={68} label="RR Door" activePart={activePart} onTap={setActivePart} getCondition={getCondition} />
          </svg>
        </div>

        {activePart ? (
          <div className="border-t border-[var(--line)] bg-[var(--surface-2)] px-3 py-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--ink-2)]">
              {PARTS.find((p) => p.key === activePart)?.label} — select condition
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CONDITIONS.map((c) => {
                const current = getCondition(activePart);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setPart(activePart, c.value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                      current === c.value
                        ? `border-transparent text-white ${c.bg}`
                        : "border-[var(--line)] bg-white text-[var(--ink-1)]"
                    }`}
                  >
                    <span
                      className="inline-block h-3 w-3 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="border-t border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-2)]">
            Tap any part to set its condition.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {value
          .filter((p) => p.condition !== "original")
          .map((p) => (
            <div
              key={p.key}
              className="flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-xs"
            >
              <span
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: conditionColor(p.condition) }}
              />
              <span className="font-semibold">{p.label}</span>
              <span className="text-[var(--ink-2)]">
                {CONDITIONS.find((c) => c.value === p.condition)?.label ?? p.condition}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}

export function defaultDamageParts(): DamagePart[] {
  return PARTS.map((p) => ({ key: p.key, label: p.label, condition: "original" }));
}
