"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { updateSchemaCategoryStatusAction } from "@/lib/actions/listing-schema";
import type { AppLocale } from "@/lib/i18n/translations";
import { SCHEMA_BUILDER_COPY } from "@/lib/i18n/schema-builder-copy";

export type SchemaCategoryNode = { id: number; name: string; path: string; level: number; is_active: boolean };

export function CategoryNavigator({ nodes, selectedId, locale }: { nodes: SchemaCategoryNode[]; selectedId: number; locale: AppLocale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isLoading, startTransition] = useTransition();
  const copy = SCHEMA_BUILDER_COPY[locale];
  const selected = nodes.find((node) => node.id === selectedId);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return query ? nodes.filter((node) => `${node.name} ${node.path}`.toLocaleLowerCase().includes(query)) : nodes;
  }, [nodes, search]);

  function selectNode(value: string) {
    const nextId = Number(value);
    if (!Number.isInteger(nextId) || nextId === selectedId) return;
    startTransition(() => router.replace(`${pathname}?node=${nextId}`, { scroll: false }));
  }

  return <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm" aria-busy={isLoading}>
    <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
      <label className="text-sm font-bold">{copy.findCategory}
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.searchPlaceholder} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal" />
      </label>
      <label className="text-sm font-bold">{copy.categoryOrSubcategory}
        <select value={selectedId} onChange={(event) => selectNode(event.target.value)} disabled={isLoading} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal disabled:opacity-60">
          {filtered.map((node) => <option key={node.id} value={node.id}>{`${"— ".repeat(Math.max(0, node.level - 1))}${node.path} — ${node.name}${node.is_active ? "" : ` (${copy.inactive})`}`}</option>)}
        </select>
      </label>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3 text-sm">
      <span className={`rounded-full px-2.5 py-1 font-semibold ${selected?.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{selected?.is_active ? copy.activeCategory : copy.inactiveCategory}</span>
      <span className="font-semibold">{selected?.name}</span><span className="text-[var(--ink-2)]">{selected?.path}</span>
      {isLoading ? <span className="ms-auto font-semibold text-[var(--accent)]">{copy.loadingEditor}</span> : <span className="ms-auto text-[var(--ink-2)]">{copy.loadAutomatically}</span>}
    </div>
    {selected ? <form action={updateSchemaCategoryStatusAction} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-2)] p-3">
      <input type="hidden" name="category_node_id" value={selected.id} />
      <input type="hidden" name="is_active" value={selected.is_active ? "false" : "true"} />
      <div>
        <p className="text-sm font-bold">{copy.availability}</p>
        <p className="text-xs text-[var(--ink-2)]">{copy.availabilityHelp}</p>
      </div>
      <button type="submit" className={`rounded-xl px-4 py-2 text-sm font-bold ${selected.is_active ? "border border-amber-300 bg-amber-50 text-amber-800" : "bg-emerald-600 text-white"}`}>
        {selected.is_active ? copy.deactivate : copy.activate}
      </button>
    </form> : null}
    <p className="mt-2 text-xs text-[var(--ink-2)]">{copy.showing} {filtered.length} {copy.of} {nodes.length} {copy.categoryCount}</p>
  </section>;
}
