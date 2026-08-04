"use client";

import { useMemo, useState } from "react";
import type { ConfiguredListingField, ListingSchemaConfig } from "@/lib/listing-schema-config";
import { publishListingSchemaAction } from "@/lib/actions/listing-schema";

const localeNames = { en: "English", fa: "دری", ps: "پښتو" } as const;
const locales = ["en", "fa", "ps"] as const;

export function SchemaBuilder({ initial, categoryNodeId, version }: { initial: ListingSchemaConfig; categoryNodeId: number; version: number }) {
  const [config, setConfig] = useState(initial);
  const [activeLocale, setActiveLocale] = useState<(typeof locales)[number]>("en");
  const serialized = useMemo(() => JSON.stringify(config), [config]);
  const detailPreview = useMemo(() => config.sections.filter((section) => section.visible).sort((a, b) => a.order - b.order).map((section) => ({
    ...section,
    fields: config.fields.filter((field) => field.active && field.detail && field.sectionKey === section.key).sort((a, b) => a.order - b.order),
  })), [config]);
  const updateField = (index: number, patch: Partial<ConfiguredListingField>) => setConfig((current) => ({
    ...current,
    fields: current.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field),
  }));
  const addSection = () => setConfig((current) => {
    const number = current.sections.length + 1;
    return { ...current, sections: [...current.sections, { key: `section_${number}`, titles: { en: `Section ${number}`, fa: `Section ${number}`, ps: `Section ${number}` }, order: current.sections.length, visible: true }] };
  });
  const addField = () => setConfig((current) => {
    const number = current.fields.length + 1;
    return { ...current, fields: [...current.fields, { key: `field_${number}`, type: "text", labels: { en: `Field ${number}`, fa: `Field ${number}`, ps: `Field ${number}` }, options: [], unit: null, sectionKey: current.sections[0]?.key || "details", order: current.fields.length, required: false, posting: true, filter: false, card: false, detail: true, active: true }] };
  });
  const updateSectionKey = (index: number, nextKey: string) => setConfig((current) => {
    const previousKey = current.sections[index]?.key;
    return { ...current, sections: current.sections.map((section, i) => i === index ? { ...section, key: nextKey } : section), fields: current.fields.map((field) => field.sectionKey === previousKey ? { ...field, sectionKey: nextKey } : field) };
  });
  const removeSection = (index: number) => setConfig((current) => {
    if (current.sections.length <= 1) return current;
    const removedKey = current.sections[index]?.key;
    const sections = current.sections.filter((_, i) => i !== index);
    return { ...current, sections, fields: current.fields.map((field) => field.sectionKey === removedKey ? { ...field, sectionKey: sections[0].key } : field) };
  });

  return (
    <form action={publishListingSchemaAction} className="space-y-5">
      <input type="hidden" name="category_node_id" value={categoryNodeId} />
      <input type="hidden" name="expected_version" value={version} />
      <input type="hidden" name="config" value={serialized} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex gap-2" role="tablist" aria-label="Editing language">
          {locales.map((locale) => <button key={locale} type="button" onClick={() => setActiveLocale(locale)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${activeLocale === locale ? "bg-[var(--ink-1)] text-white" : "bg-[var(--surface-2)]"}`}>{localeNames[locale]}</button>)}
        </div>
        <button className="rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white">Publish new version</button>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Detail-page sections</h2><button type="button" onClick={addSection} className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold">Add section</button></div>
        <div className="mt-3 space-y-3">
          {config.sections.map((section, index) => <div key={`${section.key}-${index}`} className="grid gap-3 rounded-xl bg-[var(--surface-2)] p-3 md:grid-cols-[1fr_2fr_7rem_7rem_7rem]">
            <input value={section.key} onChange={(event) => updateSectionKey(index, event.target.value)} aria-label="Section key" className="rounded-lg border border-[var(--line)] px-3 py-2" />
            <input dir={activeLocale === "en" ? "ltr" : "rtl"} value={section.titles[activeLocale]} onChange={(event) => setConfig((current) => ({ ...current, sections: current.sections.map((item, i) => i === index ? { ...item, titles: { ...item.titles, [activeLocale]: event.target.value } } : item) }))} aria-label={`Section title in ${localeNames[activeLocale]}`} className="rounded-lg border border-[var(--line)] px-3 py-2" />
            <input type="number" min="0" value={section.order} onChange={(event) => setConfig((current) => ({ ...current, sections: current.sections.map((item, i) => i === index ? { ...item, order: Number(event.target.value) } : item) }))} aria-label="Section order" className="rounded-lg border border-[var(--line)] px-3 py-2" />
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={section.visible} onChange={(event) => setConfig((current) => ({ ...current, sections: current.sections.map((item, i) => i === index ? { ...item, visible: event.target.checked } : item) }))} /> Visible</label>
            <button type="button" disabled={config.sections.length === 1} onClick={() => removeSection(index)} className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-40">Remove</button>
          </div>)}
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4" dir={activeLocale === "en" ? "ltr" : "rtl"}>
        <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Live detail-page preview</h2><p className="mt-1 text-sm text-[var(--ink-2)]">Only active fields with Detail enabled appear here.</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-bold">{localeNames[activeLocale]}</span></div>
        <div className="mt-4 space-y-3">{detailPreview.map((section) => <section key={`preview-${section.key}`} className="overflow-hidden rounded-xl border border-[var(--line)] bg-white"><header className="border-b border-[var(--line)] bg-[var(--wash)] px-4 py-3"><h3 className="font-bold">{section.titles[activeLocale] || section.titles.en}</h3></header>{section.fields.length ? <div className="grid md:grid-cols-2">{section.fields.map((field) => <div key={`preview-${section.key}-${field.key}`} className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3 text-sm"><span className="text-[var(--ink-2)]">{field.labels[activeLocale] || field.labels.en}</span><span className="font-semibold">{field.options[0]?.labels[activeLocale] || field.options[0]?.labels.en || (field.type === "boolean" ? "Yes / No" : "Example value")}</span></div>)}</div> : <p className="px-4 py-4 text-sm text-[var(--ink-2)]">No visible detail fields in this section.</p>}</section>)}</div>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Fields, filters, cards and details</h2><button type="button" onClick={addField} className="rounded-lg bg-[var(--ink-1)] px-3 py-2 text-sm font-semibold text-white">Add field</button></div>
        <p className="mt-1 text-sm text-[var(--ink-2)]">Changes are published atomically as a new version. Turning off a field does not delete values from existing listings.</p>
        <div className="mt-4 space-y-4">
          {config.fields.map((field, index) => <article key={`${field.key}-${index}`} className="rounded-xl border border-[var(--line)] p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_1fr_9rem_1fr_7rem]">
              <label className="text-xs font-bold uppercase tracking-wide">Key<input value={field.key} onChange={(event) => updateField(index, { key: event.target.value })} className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold uppercase tracking-wide">{localeNames[activeLocale]} label<input dir={activeLocale === "en" ? "ltr" : "rtl"} value={field.labels[activeLocale]} onChange={(event) => updateField(index, { labels: { ...field.labels, [activeLocale]: event.target.value } })} className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm" /></label>
              <label className="text-xs font-bold uppercase tracking-wide">Type<select value={field.type} onChange={(event) => updateField(index, { type: event.target.value as ConfiguredListingField["type"] })} className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm"><option value="text">Text</option><option value="number">Number</option><option value="boolean">Yes / no</option><option value="select">Select</option><option value="date">Date</option></select></label>
              <label className="text-xs font-bold uppercase tracking-wide">Section<select value={field.sectionKey} onChange={(event) => updateField(index, { sectionKey: event.target.value })} className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm">{config.sections.map((section) => <option key={section.key} value={section.key}>{section.titles[activeLocale]}</option>)}</select></label>
              <label className="text-xs font-bold uppercase tracking-wide">Order<input type="number" min="0" value={field.order} onChange={(event) => updateField(index, { order: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2 text-sm" /></label>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              {(["active", "required", "posting", "filter", "card", "detail"] as const).map((key) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={field[key]} onChange={(event) => updateField(index, { [key]: event.target.checked })} />{key[0].toUpperCase() + key.slice(1)}</label>)}
            </div>
            <button type="button" onClick={() => setConfig((current) => ({ ...current, fields: current.fields.filter((_, i) => i !== index) }))} className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700">Remove field</button>
            {field.type === "select" ? <label className="mt-3 block text-xs font-bold uppercase tracking-wide">Options ({localeNames[activeLocale]})<textarea dir={activeLocale === "en" ? "ltr" : "rtl"} value={field.options.map((option) => `${option.value} | ${option.labels[activeLocale]}`).join("\n")} onChange={(event) => {
              const existing = new Map(field.options.map((option) => [option.value, option]));
              const options = event.target.value.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
                const [value, ...labelParts] = line.split("|"); const cleanValue = value.trim(); const label = labelParts.join("|").trim() || cleanValue; const previous = existing.get(cleanValue);
                return { value: cleanValue, labels: { en: previous?.labels.en || cleanValue, fa: previous?.labels.fa || cleanValue, ps: previous?.labels.ps || cleanValue, [activeLocale]: label } };
              }); updateField(index, { options });
            }} className="mt-1 min-h-24 w-full rounded-lg border border-[var(--line)] px-3 py-2 font-mono text-sm" /><span className="mt-1 block normal-case text-[var(--ink-2)]">One per line: stored value | translated label</span></label> : null}
          </article>)}
        </div>
      </section>
    </form>
  );
}
