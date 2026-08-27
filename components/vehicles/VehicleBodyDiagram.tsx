"use client";

import type { AppLocale } from "@/lib/i18n/translations";
import { damageCondition, damagePartLabel } from "@/lib/vehicles/damage-report";

type BodyPart = { key: string; condition: string };

type PanelGeometry =
  | { kind: "path"; d: string }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number };

const PANELS: Record<string, PanelGeometry> = {
  front_bumper: { kind: "rect", x: 178, y: 24, width: 164, height: 42, rx: 12 },
  hood: { kind: "path", d: "M190 92 Q260 63 330 92 L322 197 Q260 178 198 197 Z" },
  roof: { kind: "path", d: "M205 262 Q260 247 315 262 L312 374 Q260 390 208 374 Z" },
  trunk: { kind: "path", d: "M198 438 Q260 458 322 438 L330 526 Q260 554 190 526 Z" },
  rear_bumper: { kind: "rect", x: 178, y: 554, width: 164, height: 42, rx: 12 },
  front_left_fender: { kind: "path", d: "M48 91 L133 91 Q157 113 177 191 L151 212 L111 194 L48 183 Z" },
  front_right_fender: { kind: "path", d: "M472 91 L387 91 Q363 113 343 191 L369 212 L409 194 L472 183 Z" },
  front_left_door: { kind: "path", d: "M48 205 L109 202 L151 220 L157 323 L48 306 Z" },
  front_right_door: { kind: "path", d: "M472 205 L411 202 L369 220 L363 323 L472 306 Z" },
  rear_left_door: { kind: "path", d: "M48 321 L157 338 L151 437 L109 455 L48 452 Z" },
  rear_right_door: { kind: "path", d: "M472 321 L363 338 L369 437 L411 455 L472 452 Z" },
  rear_left_fender: { kind: "path", d: "M48 469 L111 460 L151 444 L177 466 Q157 535 133 548 L48 548 Z" },
  rear_right_fender: { kind: "path", d: "M472 469 L409 460 L369 444 L343 466 Q363 535 387 548 L472 548 Z" },
};

const COPY = {
  en: { label: "Top-view vehicle body condition", front: "FRONT", rear: "REAR" },
  fa: { label: "نمای بالای وضعیت بدنه موتر", front: "جلو", rear: "عقب" },
  ps: { label: "د موټر د بدنې د حالت پورته لید", front: "مخ", rear: "شا" },
} as const;

function Geometry({ geometry }: { geometry: PanelGeometry }) {
  return geometry.kind === "path" ? (
    <path d={geometry.d} vectorEffect="non-scaling-stroke" />
  ) : (
    <rect
      x={geometry.x}
      y={geometry.y}
      width={geometry.width}
      height={geometry.height}
      rx={geometry.rx}
      vectorEffect="non-scaling-stroke"
    />
  );
}

function Panel({
  part,
  locale,
  active,
  onSelect,
}: {
  part: BodyPart;
  locale: AppLocale;
  active: boolean;
  onSelect?: (key: string) => void;
}) {
  const geometry = PANELS[part.key];
  if (!geometry) return null;
  const condition = damageCondition(part.condition);
  const label = `${damagePartLabel(part.key, locale)} — ${condition.labels[locale]}`;
  const interactive = Boolean(onSelect);

  return (
    <g
      fill={condition.color}
      fillOpacity={part.condition === "original" ? 0.34 : 0.92}
      stroke={active ? "#0f172a" : "#334155"}
      strokeWidth={active ? 4 : 1.75}
      className={interactive ? "cursor-pointer transition-opacity hover:opacity-80 focus:outline-none" : undefined}
      onClick={interactive ? () => onSelect?.(part.key) : undefined}
      onKeyDown={interactive ? (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect?.(part.key);
        }
      } : undefined}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? label : undefined}
    >
      <title>{label}</title>
      <Geometry geometry={geometry} />
      {interactive ? (
        <g fill="transparent" stroke="transparent" strokeWidth="18" pointerEvents="stroke">
          <Geometry geometry={geometry} />
        </g>
      ) : null}
    </g>
  );
}

export function VehicleBodyDiagram({
  parts,
  locale,
  activePart = null,
  onSelect,
  compact = false,
}: {
  parts: BodyPart[];
  locale: AppLocale;
  activePart?: string | null;
  onSelect?: (key: string) => void;
  compact?: boolean;
}) {
  const copy = COPY[locale];

  return (
    <svg
      viewBox="0 0 520 620"
      className={`h-auto w-full ${compact ? "max-w-[300px]" : "max-w-[520px]"}`}
      role="img"
      aria-label={copy.label}
    >
      <defs>
        <linearGradient id="body-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e8edf3" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9f2ff" />
          <stop offset="1" stopColor="#7895a7" />
        </linearGradient>
        <filter id="body-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.16" />
        </filter>
      </defs>

      <text x="260" y="15" textAnchor="middle" fontSize="12" fontWeight="800" letterSpacing="2.5" fill="#64748b">{copy.front}</text>

      <g filter="url(#body-shadow)">
        <path d="M188 84 Q260 53 332 84 L340 197 Q352 223 341 260 L330 381 Q342 414 332 536 Q260 566 188 536 Q178 414 190 381 L179 260 Q168 223 180 197 Z" fill="url(#body-shell)" stroke="#c5ced8" strokeWidth="4" />
        <path d="M199 199 Q260 180 321 199 L314 249 Q260 234 206 249 Z" fill="url(#glass)" stroke="#ffffff" strokeWidth="3" />
        <path d="M208 257 Q260 243 312 257 L309 378 Q260 394 211 378 Z" fill="#eef4f7" stroke="#cbd5e1" strokeWidth="2" />
        <path d="M207 386 Q260 402 313 386 L320 430 Q260 449 200 430 Z" fill="url(#glass)" stroke="#ffffff" strokeWidth="3" />
      </g>

      {parts.map((part) => (
        <Panel key={part.key} part={part} locale={locale} active={activePart === part.key} onSelect={onSelect} />
      ))}

      <g fill="#1f2937" stroke="#0f172a" strokeWidth="2" pointerEvents="none">
        <rect x="13" y="128" width="31" height="92" rx="15" />
        <rect x="476" y="128" width="31" height="92" rx="15" />
        <rect x="13" y="425" width="31" height="92" rx="15" />
        <rect x="476" y="425" width="31" height="92" rx="15" />
      </g>
      <g fill="#64748b" stroke="#e2e8f0" strokeWidth="3" pointerEvents="none">
        <path d="M167 202 Q145 197 138 215 Q151 230 173 220 Z" />
        <path d="M353 202 Q375 197 382 215 Q369 230 347 220 Z" />
      </g>
      <g fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" pointerEvents="none">
        <rect x="194" y="33" width="31" height="12" rx="5" />
        <rect x="295" y="33" width="31" height="12" rx="5" />
        <rect x="194" y="573" width="31" height="12" rx="5" />
        <rect x="295" y="573" width="31" height="12" rx="5" />
      </g>
      <path d="M254 85 H266" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" pointerEvents="none" />
      <path d="M254 533 H266" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" pointerEvents="none" />
      <text x="260" y="617" textAnchor="middle" fontSize="12" fontWeight="800" letterSpacing="2.5" fill="#64748b">{copy.rear}</text>
    </svg>
  );
}
