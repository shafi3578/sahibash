"use client";

import { useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/lib/i18n/translations";
import type { VehicleModel3D } from "@/lib/vehicles/model-catalog";

type ViewerState = "idle" | "loading" | "ready" | "error";

const COPY = {
  en: { title: "Interactive 3D view", description: "Inspect the vehicle from every angle. The 3D model is a visual reference for the selected make and model; listing photos remain the authoritative condition record.", load: "Load 3D view", loading: "Loading 3D model…", retry: "Try again", error: "The 3D model could not be displayed on this device.", controls: "Drag to rotate · Scroll or pinch to zoom", fullscreen: "Full screen", reference: "Reference model" },
  fa: { title: "نمای تعاملی سه‌بعدی", description: "موتر را از هر زاویه بررسی کنید. مدل سه‌بعدی تنها مرجع تصویری ساخت و مدل انتخاب‌شده است؛ عکس‌های اعلان وضعیت اصلی را نشان می‌دهند.", load: "نمایش مدل سه‌بعدی", loading: "مدل سه‌بعدی بارگذاری می‌شود…", retry: "تلاش دوباره", error: "مدل سه‌بعدی در این دستگاه نمایش داده نشد.", controls: "برای چرخش بکشید · برای زوم اسکرول یا نیشگون کنید", fullscreen: "تمام صفحه", reference: "مدل مرجع" },
  ps: { title: "متقابل درې‌بعدي لید", description: "موټر له هرې زاویې وګورئ. درې‌بعدي ماډل د ټاکل شوي جوړ او ماډل لپاره انځوریزه بېلګه ده؛ د اعلان عکسونه د حالت اصلي ریکارډ دی.", load: "درې‌بعدي لید پرانیزئ", loading: "درې‌بعدي ماډل پورته کېږي…", retry: "بیا هڅه", error: "درې‌بعدي ماډل په دې وسیله کې ونه ښودل شو.", controls: "د څرخول لپاره کش کړئ · د زوم لپاره سکرول یا پنچ کړئ", fullscreen: "بشپړ سکرین", reference: "مرجع ماډل" },
} as const;

export function VehicleModelViewer({ model, locale }: { model: VehicleModel3D; locale: AppLocale }) {
  const [requested, setRequested] = useState(false);
  const [state, setState] = useState<ViewerState>("idle");
  const frameRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const text = COPY[locale];

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
    const handleLoad = () => setState("ready");
    const handleError = () => setState("error");
    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);
    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [requested, state]);

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
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-2)]">{text.description}</p>
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
            />
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
    </section>
  );
}
