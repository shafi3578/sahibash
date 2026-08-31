"use client";

import { useId } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import { damageCondition, damagePartLabel } from "@/lib/vehicles/damage-report";

type BodyPart = { key: string; condition: string };

type PanelGeometry =
  | { kind: "path"; d: string }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number };

const REFERENCE_IMAGE = "/vehicle-body-reference.svg";

// These hit areas follow the exact separated-panel reference supplied for Sahibash.
// The reference remains visually untouched for original panels; colors are layered only
// when a seller reports a non-original condition.
const PANELS: Record<string, PanelGeometry> = {
  front_bumper: { kind: "rect", x: 122, y: 8, width: 121, height: 31, rx: 7 },
  hood: { kind: "path", d: "M135 48 Q181 40 228 48 Q239 56 240 73 L242 130 Q181 113 121 131 L123 73 Q125 57 135 48 Z" },
  roof: { kind: "path", d: "M141 188 Q181 181 221 188 L222 284 Q181 292 140 284 Z" },
  trunk: { kind: "path", d: "M140 331 Q181 344 222 331 L238 359 Q181 375 124 359 Z" },
  rear_bumper: { kind: "rect", x: 122, y: 377, width: 121, height: 32, rx: 7 },
  // Adjacent side panels share the same boundary coordinates. Keeping the
  // hit areas edge-to-edge prevents a door from intercepting a fender tap.
  front_left_fender: { kind: "path", d: "M31 48 L55 48 Q80 65 100 94 L72 108 Q64 128 64 151 L31 151 Z" },
  front_right_fender: { kind: "path", d: "M332 48 L308 48 Q283 65 263 94 L291 108 Q299 128 299 151 L332 151 Z" },
  front_left_door: { kind: "path", d: "M31 151 L64 151 Q64 128 72 108 Q106 130 139 190 L139 220 L84 232 L31 220 Z" },
  front_right_door: { kind: "path", d: "M332 151 L299 151 Q299 128 291 108 Q257 130 242 190 L242 220 L296 232 L332 220 Z" },
  rear_left_door: { kind: "path", d: "M31 220 L84 232 L139 220 L139 291 L84 302 L31 289 Z" },
  rear_right_door: { kind: "path", d: "M332 220 L296 232 L242 220 L242 291 L296 302 L332 289 Z" },
  rear_left_fender: { kind: "path", d: "M31 289 L84 302 L139 291 Q119 335 84 358 L55 370 L31 369 Z" },
  rear_right_fender: { kind: "path", d: "M332 289 L296 302 L242 291 Q262 335 296 358 L308 370 L332 369 Z" },
};

const COPY = {
  en: { label: "Interactive top-view vehicle body condition" },
  fa: { label: "نمای تعاملی بالای وضعیت بدنه موتر" },
  ps: { label: "د موټر د بدنې د حالت متقابل پورته لید" },
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
  bodyMaskId,
  glowId,
  onSelect,
}: {
  part: BodyPart;
  locale: AppLocale;
  active: boolean;
  bodyMaskId: string;
  glowId: string;
  onSelect?: (key: string) => void;
}) {
  const geometry = PANELS[part.key];
  if (!geometry) return null;

  const condition = damageCondition(part.condition);
  const label = `${damagePartLabel(part.key, locale)} — ${condition.labels[locale]}`;
  const interactive = Boolean(onSelect);
  const changed = part.condition !== "original";

  return (
    <g
      data-vehicle-panel={part.key}
      className={interactive ? "cursor-pointer focus:outline-none" : undefined}
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

      {changed ? (
        <g mask={`url(#${bodyMaskId})`} fill={condition.color} fillOpacity="0.94">
          <Geometry geometry={geometry} />
        </g>
      ) : null}

      {active ? (
        <g fill="none" stroke="#0f172a" strokeWidth="3.5" strokeLinejoin="round" style={{ filter: `url(#${glowId})` }}>
          <Geometry geometry={geometry} />
        </g>
      ) : null}

      {interactive ? (
        <g fill="transparent" pointerEvents="fill">
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
  const instanceId = useId().replace(/:/g, "");
  const thresholdId = `vehicle-threshold-${instanceId}`;
  const bodyMaskId = `vehicle-body-mask-${instanceId}`;
  const wheelClipId = `vehicle-wheel-clip-${instanceId}`;
  const activeGlowId = `vehicle-active-${instanceId}`;

  return (
    <svg
      viewBox="0 0 404 433"
      className={`h-auto w-full select-none ${compact ? "max-w-[404px]" : "max-w-[440px]"}`}
      role="img"
      aria-label={copy.label}
    >
      <defs>
        <filter id={thresholdId} colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="-8" intercept="7.8" />
            <feFuncG type="linear" slope="-8" intercept="7.8" />
            <feFuncB type="linear" slope="-8" intercept="7.8" />
          </feComponentTransfer>
        </filter>
        <mask id={bodyMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="404" height="433" style={{ maskType: "luminance" }}>
          <image href={REFERENCE_IMAGE} width="404" height="433" filter={`url(#${thresholdId})`} />
        </mask>
        <clipPath id={wheelClipId}>
          <circle cx="36" cy="104" r="28" />
          <circle cx="329" cy="104" r="28" />
          <circle cx="36" cy="308" r="28" />
          <circle cx="329" cy="308" r="28" />
        </clipPath>
        <filter id={activeGlowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.95" />
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#0f172a" floodOpacity="0.4" />
        </filter>
      </defs>

      <image href={REFERENCE_IMAGE} width="404" height="433" pointerEvents="none" />

      {parts.map((part) => (
        <Panel
          key={part.key}
          part={part}
          locale={locale}
          active={activePart === part.key}
          bodyMaskId={bodyMaskId}
          glowId={activeGlowId}
          onSelect={onSelect}
        />
      ))}

      <image
        href={REFERENCE_IMAGE}
        width="404"
        height="433"
        clipPath={`url(#${wheelClipId})`}
        pointerEvents="none"
      />
    </svg>
  );
}
