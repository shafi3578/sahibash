"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

export type SchemaCategoryNode = { id: number; name: string; path: string; level: number; is_active: boolean };

export function CategoryNavigator({ nodes, selectedId }: { nodes: SchemaCategoryNode[]; selectedId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [isLoading, startTransition] = useTransition();
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
      <label className="text-sm font-bold">Find a category
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or path…" className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal" />
      </label>
      <label className="text-sm font-bold">Category or subcategory
        <select value={selectedId} onChange={(event) => selectNode(event.target.value)} disabled={isLoading} className="mt-1 w-full rounded-xl border border-[var(--line)] px-3 py-2.5 font-normal disabled:opacity-60">
          {filtered.map((node) => <option key={node.id} value={node.id}>{`${"— ".repeat(Math.max(0, node.level - 1))}${node.path} — ${node.name}${node.is_active ? "" : " (inactive)"}`}</option>)}
        </select>
      </label>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--line)] pt-3 text-sm">
      <span className={`rounded-full px-2.5 py-1 font-semibold ${selected?.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{selected?.is_active ? "Active category" : "Inactive category"}</span>
      <span className="font-semibold">{selected?.name}</span><span className="text-[var(--ink-2)]">{selected?.path}</span>
      {isLoading ? <span className="ms-auto font-semibold text-[var(--accent)]">Loading editor…</span> : <span className="ms-auto text-[var(--ink-2)]">Select another item to load its editor automatically.</span>}
    </div>
    <p className="mt-2 text-xs text-[var(--ink-2)]">Showing {filtered.length} of {nodes.length} categories and subcategories.</p>
  </section>;
}
