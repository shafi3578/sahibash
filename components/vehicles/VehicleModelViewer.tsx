"use client";

import { useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import type { VehicleModel3D } from "@/lib/vehicles/model-catalog";
import {
  damageCondition,
  damagePartLabel,
  getNonOriginalVehicleDamageParts,
  type DamagePart,
} from "@/lib/vehicles/damage-report";

type ViewerState = "idle" | "loading" | "ready" | "error";

type ModelViewerMaterial = {
  name: string;
  pbrMetallicRoughness: { setBaseColorFactor: (color: [number, number, number, number]) => void };
};

type ModelViewerElement = HTMLElement & { model?: { materials: ModelViewerMaterial[] } };

const PANEL_HOTSPOTS: Record<string, { position: string; normal: string }> = {
  front_bumper: { position: "0m 0.4m 2.2m", normal: "0m 0m 1m" },
  hood: { position: "0m 0.78m 1.62m", normal: "0m 1m 0.25m" },
  roof: { position: "0m 1.4m 0m", normal: "0m 1m 0m" },
  trunk: { position: "0m 0.8m -1.5m", normal: "0m 1m -0.25m" },
  rear_bumper: { position: "0m 0.4m -2.2m", normal: "0m 0m -1m" },
  front_left_fender: { position: "-0.78m 0.62m 1.4m", normal: "-1m 0.25m 0m" },
  front_right_fender: { position: "0.78m 0.62m 1.4m", normal: "1m 0.25m 0m" },
  front_left_door: { position: "-0.78m 0.66m 0.3m", normal: "-1m 0.15m 0m" },
  front_right_door: { position: "0.78m 0.66m 0.3m", normal: "1m 0.15m 0m" },
  rear_left_door: { position: "-0.78m 0.66m -0.62m", normal: "-1m 0.15m 0m" },
  rear_right_door: { position: "0.78m 0.66m -0.62m", normal: "1m 0.15m 0m" },
  rear_left_fender: { position: "-0.78m 0.58m -1.5m", normal: "-1m 0.2m 0m" },
  rear_right_fender: { position: "0.78m 0.58m -1.5m", normal: "1m 0.2m 0m" },
};

function hexColorFactor(hex: string): [number, number, number, number] {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255).concat(1) as [number, number, number, number];
}

function applyPanelColors(viewer: ModelViewerElement, model: VehicleModel3D, parts: DamagePart[]) {
  if (!model.supportsPanelColors || !viewer.model) return;
  const partsByKey = new Map(parts.map((part) => [part.key, part]));
  for (const material of viewer.model.materials) {
    if (!material.name.startsWith("condition__")) continue;
    const part = partsByKey.get(material.name.slice("condition__".length));
    if (!part) continue;
    material.pbrMetallicRoughness.setBaseColorFactor(hexColorFactor(damageCondition(part.condition).color));
  }
}

const COPY = {
  en: { title: "Interactive 3D view", description: "Inspect the vehicle from every angle. Seller-reported paint, replacement, and damage are connected to this 3D reference below; listing photos remain the authoritative condition record.", descriptionNoReport: "Inspect the reference vehicle from every angle. Listing photos remain the authoritative condition record.", load: "Load 3D view", loading: "Loading 3D model…", retry: "Try again", error: "The 3D model could not be displayed on this device.", controls: "Drag to rotate · Scroll or pinch to zoom", fullscreen: "Full screen", reference: "Reference model", report: "Seller body-condition report", allOriginal: "Seller reported all body panels as original", marked: "reported panels need attention" },
  fa: { title: "نمای تعاملی سه‌بعدی", description: "موتر را از هر زاویه بررسی کنید. رنگ، تعویض و آسیب ثبت‌شده توسط فروشنده در پایین به این مرجع سه‌بعدی وصل است؛ عکس‌های اعلان مرجع اصلی وضعیت است.", descriptionNoReport: "موتر مرجع را از هر زاویه بررسی کنید. عکس‌های اعلان مرجع اصلی وضعیت است.", load: "نمایش مدل سه‌بعدی", loading: "مدل سه‌بعدی بارگذاری می‌شود…", retry: "تلاش دوباره", error: "مدل سه‌بعدی در این دستگاه نمایش داده نشد.", controls: "برای چرخش بکشید · برای زوم اسکرول یا نیشگون کنید", fullscreen: "تمام صفحه", reference: "مدل مرجع", report: "گزارش وضعیت بدنه فروشنده", allOriginal: "فروشنده تمام قطعات بدنه را اصلی ثبت کرده است", marked: "قطعه ثبت‌شده نیاز به توجه دارد" },
  ps: { title: "متقابل درې‌بعدي لید", description: "موټر له هرې زاویې وګورئ. د پلورونکي ثبت شوی رنګ، بدلون او زیان لاندې له دې درې‌بعدي مرجع سره نښلول شوی؛ د اعلان عکسونه د حالت اصلي ریکارډ دی.", descriptionNoReport: "مرجع موټر له هرې زاویې وګورئ. د اعلان عکسونه د حالت اصلي ریکارډ دی.", load: "درې‌بعدي لید پرانیزئ", loading: "درې‌بعدي ماډل پورته کېږي…", retry: "بیا هڅه", error: "درې‌بعدي ماډل په دې وسیله کې ونه ښودل شو.", controls: "د څرخول لپاره کش کړئ · د زوم لپاره سکرول یا پنچ کړئ", fullscreen: "بشپړ سکرین", reference: "مرجع ماډل", report: "د پلورونکي د بدنې راپور", allOriginal: "پلورونکي د بدنې ټولې برخې اصلي ثبت کړې دي", marked: "ثبت شوې برخې پاملرنې ته اړتیا لري" },
} as const;

export function VehicleModelViewer({ model, locale, damageParts = [], hasDamageReport = false }: { model: VehicleModel3D; locale: AppLocale; damageParts?: DamagePart[]; hasDamageReport?: boolean }) {
  const [requested, setRequested] = useState(false);
  const [state, setState] = useState<ViewerState>("idle");
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<ModelViewerElement>(null);
  const text = COPY[locale];
  const nonOriginalParts = getNonOriginalVehicleDamageParts(damageParts);

  useEffect(() => {
    if (!requested) return;
    let active = true;
    import("@google/model-viewer")
      .then(() => { if (active) setState("loading"); })
      .catch(() => { if (active) setState("error"); });
    return () => { active = false; };
  }, [requested]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !requested) return;
    const handleLoad = () => {
      applyPanelColors(viewer, model, nonOriginalParts);
      setState("ready");
    };
    const handleError = () => setState("error");
    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);
    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [model, nonOriginalParts, requested, state]);

  function retry() {
    setRequested(false);
    setState("idle");
    window.setTimeout(() => {
      setState("loading");
      setRequested(true);
    }, 0);
  }

  async function openFullscreen() {
    if (frameRef.current?.requestFullscreen) await frameRef.current.requestFullscreen();
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] p-4 sm:p-5">
        <div>
          <h2 className="text-base font-bold">{text.title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-2)]">{hasDamageReport ? text.description : text.descriptionNoReport}</p>
        </div>
        <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--ink-2)]">
          {text.reference}: {model.label}
        </span>
      </div>

      <div ref={frameRef} className="relative min-h-[320px] bg-gradient-to-b from-slate-50 to-slate-200 sm:min-h-[460px]">
        {!requested ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/80 bg-white/80 text-4xl shadow-sm" aria-hidden="true">🚙</div>
            <div>
              <p className="font-bold">{model.label}</p>
              <p className="mt-1 text-xs text-[var(--ink-2)]">{text.controls}</p>
            </div>
            <button type="button" onClick={() => { setState("loading"); setRequested(true); }} className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2">
              {text.load}
            </button>
          </div>
        ) : state === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-sm font-semibold">{text.error}</p>
            <button type="button" onClick={retry} className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-bold">{text.retry}</button>
          </div>
        ) : (
          <>
            <model-viewer
              ref={viewerRef}
              src={model.src}
              alt={`${model.label} interactive 3D reference model`}
              camera-controls
              auto-rotate
              shadow-intensity="1"
              environment-image="neutral"
              interaction-prompt="auto"
              touch-action="pan-y"
              loading="eager"
              reveal="auto"
              className="h-[320px] w-full sm:h-[460px]"
            >
              {model.supportsPanelColors ? nonOriginalParts.map((part) => {
                const hotspot = PANEL_HOTSPOTS[part.key];
                if (!hotspot) return null;
                const condition = damageCondition(part.condition);
                return (
                  <button
                    key={part.key}
                    type="button"
                    slot={`hotspot-${part.key}`}
                    data-position={hotspot.position}
                    data-normal={hotspot.normal}
                    data-visibility-attribute="visible"
                    className="pointer-events-none -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity data-[visible]:opacity-100"
                    aria-label={`${damagePartLabel(part.key, locale)}: ${condition.labels[locale]}`}
                  >
                    <span
                      className="block whitespace-nowrap text-center text-[10px] font-black uppercase leading-none tracking-tight text-white/90 sm:text-xs"
                      style={{ WebkitTextStroke: `1px ${condition.color}`, textShadow: "0 1px 2px rgba(0,0,0,.95), 0 0 5px rgba(0,0,0,.8)" }}
                    >
                      <span className="block">{condition.labels[locale]}</span>
                      <span className="mt-0.5 block text-[7px] font-extrabold normal-case tracking-normal text-white/80 sm:text-[8px]">{damagePartLabel(part.key, locale)}</span>
                    </span>
                  </button>
                );
              }) : null}
            </model-viewer>
            {state === "loading" ? (
              <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center gap-2 bg-white/85 px-3 py-2 text-xs font-semibold backdrop-blur-sm" aria-live="polite">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
                {text.loading}
              </div>
            ) : null}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-10 text-xs font-semibold text-white">
              <span>{text.controls}</span>
              <button type="button" onClick={openFullscreen} className="pointer-events-auto rounded-lg bg-white/90 px-3 py-1.5 text-slate-900 shadow-sm">{text.fullscreen}</button>
            </div>
          </>
        )}
      </div>

      {hasDamageReport ? <div className="border-t border-[var(--line)] p-4 sm:p-5" dir={locale === "en" ? "ltr" : "rtl"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold">{text.report}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${nonOriginalParts.length > 0 ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-800"}`}>
            {nonOriginalParts.length > 0 ? `${nonOriginalParts.length} ${text.marked}` : text.allOriginal}
          </span>
        </div>
        {nonOriginalParts.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {nonOriginalParts.map((part) => {
              const condition = damageCondition(part.condition);
              return (
                <div key={part.key} className="flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: condition.color }} />
                  <span><strong>{damagePartLabel(part.key, locale)}</strong><br /><span className="text-[var(--ink-2)]">{condition.labels[locale]}</span></span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div> : null}
    </section>
  );
}
