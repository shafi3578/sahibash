"use client";

import { useId } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import { damageCondition, damagePartLabel } from "@/lib/vehicles/damage-report";

type BodyPart = { key: string; condition: string };

type PanelGeometry =
  | { kind: "path"; d: string }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number };

// The thirteen shapes deliberately match the persisted vehicle damage-part keys.
// Keeping this map shared by the seller and buyer views makes the visual report lossless.
const PANELS: Record<string, PanelGeometry> = {
  front_bumper: { kind: "rect", x: 171, y: 32, width: 178, height: 48, rx: 13 },
  hood: { kind: "path", d: "M184 103 Q260 75 336 103 L326 222 Q260 202 194 222 Z" },
  roof: { kind: "path", d: "M207 297 Q260 282 313 297 L311 412 Q260 427 209 412 Z" },
  trunk: { kind: "path", d: "M195 480 Q260 499 325 480 L337 581 Q260 610 183 581 Z" },
  rear_bumper: { kind: "rect", x: 171, y: 619, width: 178, height: 48, rx: 13 },
  front_left_fender: { kind: "path", d: "M49 106 L124 97 Q153 114 175 209 L150 237 L102 220 L49 208 Z" },
  front_right_fender: { kind: "path", d: "M471 106 L396 97 Q367 114 345 209 L370 237 L418 220 L471 208 Z" },
  front_left_door: { kind: "path", d: "M49 228 L101 226 L150 245 L164 345 L49 326 Z" },
  front_right_door: { kind: "path", d: "M471 228 L419 226 L370 245 L356 345 L471 326 Z" },
  rear_left_door: { kind: "path", d: "M49 343 L164 362 L150 467 L101 485 L49 482 Z" },
  rear_right_door: { kind: "path", d: "M471 343 L356 362 L370 467 L419 485 L471 482 Z" },
  rear_left_fender: { kind: "path", d: "M49 502 L102 493 L150 474 L175 502 Q153 584 124 599 L49 590 Z" },
  rear_right_fender: { kind: "path", d: "M471 502 L418 493 L370 474 L345 502 Q367 584 396 599 L471 590 Z" },
};

const COPY = {
  en: { label: "Interactive top-view vehicle body condition", front: "FRONT", rear: "REAR" },
  fa: { label: "نمای تعاملی بالای وضعیت بدنه موتر", front: "جلو", rear: "عقب" },
  ps: { label: "د موټر د بدنې د حالت متقابل پورته لید", front: "مخ", rear: "شا" },
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
  glowId,
  onSelect,
}: {
  part: BodyPart;
  locale: AppLocale;
  active: boolean;
  glowId: string;
  onSelect?: (key: string) => void;
}) {
  const geometry = PANELS[part.key];
  if (!geometry) return null;

  const condition = damageCondition(part.condition);
  const label = `${damagePartLabel(part.key, locale)} — ${condition.labels[locale]}`;
  const interactive = Boolean(onSelect);
  const original = part.condition === "original";

  return (
    <g
      data-vehicle-panel={part.key}
      fill={original ? "#d4d7dc" : condition.color}
      fillOpacity={original ? 0.98 : 0.9}
      stroke={active ? "#0f172a" : original ? "#a8afb8" : "#ffffff"}
      strokeWidth={active ? 4.5 : original ? 2 : 2.5}
      strokeLinejoin="round"
      style={active ? { filter: `url(#${glowId})` } : undefined}
      className={interactive ? "cursor-pointer transition-opacity hover:opacity-85 focus:outline-none" : undefined}
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
      aria-pressed={interactive ? active : undefined}
    >
      <title>{label}</title>
      <Geometry geometry={geometry} />
      {interactive ? (
        <g fill="transparent" stroke="transparent" strokeWidth="20" pointerEvents="stroke">
          <Geometry geometry={geometry} />
        </g>
      ) : null}
    </g>
  );
}

function Wheel({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <rect x="-21" y="-52" width="42" height="104" rx="20" fill="#20252b" stroke="#0f172a" strokeWidth="3" />
      <rect x="-12" y="-37" width="24" height="74" rx="11" fill="#4b5563" />
      <path d="M-10 -22 H10 M-10 0 H10 M-10 22 H10" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
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
  const instanceId = useId().replace(/:/g, "");
  const bodyGradientId = `vehicle-body-${instanceId}`;
  const glassGradientId = `vehicle-glass-${instanceId}`;
  const shadowId = `vehicle-shadow-${instanceId}`;
  const activeGlowId = `vehicle-active-${instanceId}`;

  return (
    <svg
      viewBox="0 0 520 700"
      className={`h-auto w-full select-none ${compact ? "max-w-[390px]" : "max-w-[500px]"}`}
      role="img"
      aria-label={copy.label}
    >
      <defs>
        <linearGradient id={bodyGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.52" stopColor="#f4f6f8" />
          <stop offset="1" stopColor="#dfe4e9" />
        </linearGradient>
        <linearGradient id={glassGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dff5ff" />
          <stop offset="0.48" stopColor="#9bb7c7" />
          <stop offset="1" stopColor="#5f7482" />
        </linearGradient>
        <filter id={shadowId} x="-25%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.18" />
        </filter>
        <filter id={activeGlowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#0f172a" floodOpacity="0.42" />
        </filter>
      </defs>

      <g aria-hidden="true" pointerEvents="none">
        <path d="M260 10 L252 23 H268 Z" fill="#64748b" />
        <text x="260" y="40" textAnchor="middle" fontSize="12" fontWeight="800" letterSpacing="2.4" fill="#64748b">
          {copy.front}
        </text>
      </g>

      <g filter={`url(#${shadowId})`}>
        <Wheel x={29} y={173} />
        <Wheel x={491} y={173} />
        <Wheel x={29} y={523} />
        <Wheel x={491} y={523} />

        <path
          d="M181 98 Q260 66 339 98 L350 211 Q363 244 349 291 L338 419 Q354 453 340 592 Q260 621 180 592 Q166 453 182 419 L171 291 Q157 244 170 211 Z"
          fill={`url(#${bodyGradientId})`}
          stroke="#c5cbd2"
          strokeWidth="5"
          strokeLinejoin="round"
          pointerEvents="none"
        />

        {parts.map((part) => (
          <Panel
            key={part.key}
            part={part}
            locale={locale}
            active={activePart === part.key}
            glowId={activeGlowId}
            onSelect={onSelect}
          />
        ))}

        <g pointerEvents="none">
          <path
            d="M194 226 Q260 205 326 226 L315 291 Q260 275 205 291 Z"
            fill={`url(#${glassGradientId})`}
            stroke="#eef7fb"
            strokeWidth="4"
          />
          <path
            d="M208 292 Q260 278 312 292 L310 417 Q260 432 210 417 Z"
            fill="#edf1f4"
            fillOpacity="0.86"
            stroke="#bbc5ce"
            strokeWidth="2"
          />
          <path
            d="M207 420 Q260 436 313 420 L324 474 Q260 493 196 474 Z"
            fill={`url(#${glassGradientId})`}
            stroke="#eef7fb"
            strokeWidth="4"
          />

          <path d="M102 239 L147 255 L158 334 L111 326 Z" fill={`url(#${glassGradientId})`} stroke="#f8fafc" strokeWidth="3" />
          <path d="M418 239 L373 255 L362 334 L409 326 Z" fill={`url(#${glassGradientId})`} stroke="#f8fafc" strokeWidth="3" />
          <path d="M111 349 L158 367 L147 455 L102 472 Z" fill={`url(#${glassGradientId})`} stroke="#f8fafc" strokeWidth="3" />
          <path d="M409 349 L362 367 L373 455 L418 472 Z" fill={`url(#${glassGradientId})`} stroke="#f8fafc" strokeWidth="3" />

          <path d="M169 232 Q144 224 137 244 Q151 260 176 246 Z" fill="#8d99a4" stroke="#f8fafc" strokeWidth="2.5" />
          <path d="M351 232 Q376 224 383 244 Q369 260 344 246 Z" fill="#8d99a4" stroke="#f8fafc" strokeWidth="2.5" />

          <g fill="#f8fafc" stroke="#9aa4af" strokeWidth="2">
            <rect x="191" y="47" width="37" height="13" rx="5" />
            <rect x="292" y="47" width="37" height="13" rx="5" />
          </g>
          <g fill="#ef4444" fillOpacity="0.78" stroke="#9f1239" strokeWidth="1.5">
            <rect x="191" y="638" width="37" height="12" rx="5" />
            <rect x="292" y="638" width="37" height="12" rx="5" />
          </g>

          <g fill="#7b8792">
            <rect x="116" y="289" width="21" height="4" rx="2" />
            <rect x="383" y="289" width="21" height="4" rx="2" />
            <rect x="116" y="405" width="21" height="4" rx="2" />
            <rect x="383" y="405" width="21" height="4" rx="2" />
          </g>

          <path d="M260 106 V215 M260 488 V579" stroke="#b6bdc5" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.8" />
          <path d="M245 106 Q260 98 275 106" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
          <path d="M244 578 Q260 586 276 578" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        </g>
      </g>

      <g aria-hidden="true" pointerEvents="none">
        <text x="260" y="692" textAnchor="middle" fontSize="12" fontWeight="800" letterSpacing="2.4" fill="#64748b">
          {copy.rear}
        </text>
      </g>
    </svg>
  );
}
