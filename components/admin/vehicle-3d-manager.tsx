"use client";

import { useMemo, useState } from "react";
import type { VehicleModel3D } from "@/lib/vehicles/model-catalog";

type Copy = {
  global: string;
  off: string;
  on: string;
  onLater: string;
  choose: string;
  selected: string;
  selectModels: string;
  close: string;
  upload: string;
  inactive: string;
  draft: string;
  submit: string;
  disabled: string;
  storageNote: string;
  activeLater: string;
};

export function Vehicle3DManager({ models, copy }: { models: readonly VehicleModel3D[]; copy: Copy }) {
  const [enabled, setEnabled] = useState(false);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedModels = useMemo(
    () => models.filter((model) => selectedIds.includes(model.id)),
    [models, selectedIds],
  );

  function toggleModel(modelId: string) {
    setSelectedIds((current) => current.includes(modelId)
      ? current.filter((id) => id !== modelId)
      : [...current, modelId]);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">{copy.global}</span>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold">{enabled ? copy.on : copy.off}</p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--ink-2)]">{copy.onLater}</p>
          </div>
          <button
            type="button"
            aria-pressed={enabled}
            onClick={() => {
              setEnabled((value) => !value);
              setChooserOpen(true);
            }}
            className={`relative h-12 w-24 rounded-full p-1 text-xs font-black uppercase tracking-wide transition ${enabled ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"}`}
          >
            <span className={`absolute left-1 top-1 h-10 w-10 rounded-full bg-white shadow-lg transition ${enabled ? "translate-x-12" : "translate-x-0"}`} />
            <span className="relative z-10">{enabled ? "ON" : "OFF"}</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => setChooserOpen(true)}
          className="mt-5 rounded-2xl bg-[var(--ink-1)] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
        >
          {copy.selectModels}
        </button>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {selectedModels.length ? selectedModels.map((model) => (
          <article key={model.id} className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-bold">{model.label}</p>
                <p className="mt-1 text-xs text-[var(--ink-2)]">{model.matchNote}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{copy.draft}</span>
            </div>
            <div className="mt-4 space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <label className="block text-sm font-semibold">
                {copy.upload}
                <input
                  disabled={!enabled}
                  type="file"
                  accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
              <button disabled className="rounded-xl bg-slate-300 px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed">
                {copy.submit}
              </button>
              <p className="text-xs leading-5 text-[var(--ink-2)]">{copy.storageNote}</p>
            </div>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-[var(--ink-2)] lg:col-span-2">
            {copy.selected}
          </div>
        )}
      </section>

      {chooserOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-black/35 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-bold">{copy.choose}</h2>
              <button type="button" onClick={() => setChooserOpen(false)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold">{copy.close}</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {models.map((model) => {
                const checked = selectedIds.includes(model.id);
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => toggleModel(model.id)}
                    className={`rounded-3xl border p-4 text-start transition hover:-translate-y-0.5 ${checked ? "border-[var(--accent)] bg-amber-50 shadow-sm" : "border-slate-200 bg-slate-50"}`}
                  >
                    <span className="text-sm font-bold">{model.label}</span>
                    <span className="mt-2 block text-xs text-[var(--ink-2)]">{model.matchNote}</span>
                    <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${checked ? "bg-[var(--accent)] text-white" : "bg-white text-slate-500"}`}>
                      {checked ? copy.activeLater : copy.inactive}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
