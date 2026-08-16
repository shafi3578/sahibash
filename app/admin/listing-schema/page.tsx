import Link from "next/link";
import { requireSuperAdministrator } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getListingSchemaHistory } from "@/lib/data/listing-schema-config";
import { normalizeListingSchemaConfig, type ListingSchemaConfig, type SchemaOption } from "@/lib/listing-schema-config";
import { SchemaBuilder } from "./schema-builder";
import { CategoryNavigator } from "./category-navigator";
import { getDictionary } from "@/lib/i18n/server";
import { SCHEMA_BUILDER_COPY } from "@/lib/i18n/schema-builder-copy";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { localizePath } from "@/lib/i18n/routing";

type Params = Promise<{ node?: string; saved?: string; status_updated?: string }>;
const labels = (value: string) => ({ en: value, fa: value, ps: value });

function optionsFrom(value: unknown): SchemaOption[] {
  const raw = Array.isArray(value) ? value : value && typeof value === "object" && Array.isArray((value as { options?: unknown[] }).options) ? (value as { options: unknown[] }).options : [];
  return raw.map((item) => typeof item === "string" ? { value: item, labels: labels(item) } : item && typeof item === "object" ? { value: String((item as { value?: unknown }).value ?? ""), labels: labels(String((item as { label?: unknown; value?: unknown }).label ?? (item as { value?: unknown }).value ?? "")) } : null).filter((item): item is SchemaOption => Boolean(item?.value));
}

export default async function ListingSchemaAdminPage({ searchParams }: { searchParams: Params }) {
  await requireSuperAdministrator();
  const { locale } = await getDictionary();
  const copy = SCHEMA_BUILDER_COPY[locale];
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: nodes, error: nodesError } = await supabase.from("category_nodes").select("id, name, path, level, parent_id, is_active").order("path");
  if (nodesError) throw new Error(`Unable to load categories: ${nodesError.message}`);
  const allNodes = nodes ?? [];
  const selectedId = Number(params.node) || Number(allNodes[0]?.id || 0);
  const selected = allNodes.find((node) => Number(node.id) === selectedId);
  const history = selectedId ? await getListingSchemaHistory(selectedId) : [];
  const published = history.find((item) => item.status === "published") ?? null;

  let config: ListingSchemaConfig | null = published?.config ?? null;
  if (!config && selectedId) {
    const [{ data: fields }, { data: filters }] = await Promise.all([
      supabase.from("category_fields").select("*").eq("category_node_id", selectedId).order("sort_order").order("display_order"),
      supabase.from("filter_definitions").select("filter_key").eq("category_node_id", selectedId).eq("is_active", true),
    ]);
    const filterKeys = new Set((filters ?? []).map((item) => item.filter_key));
    const sectionKeys = [...new Set((fields ?? []).map((field) => String(field.group_key || "details")))];
    config = normalizeListingSchemaConfig({ schemaVersion: 1, sections: (sectionKeys.length ? sectionKeys : ["details"]).map((key, index) => ({ key, titles: labels(key.replace(/_/g, " ")), order: index, visible: true })), fields: (fields ?? []).map((field, index) => ({ key: field.field_key, type: field.field_type, labels: labels(field.field_label), options: optionsFrom(field.options_json), unit: field.unit, sectionKey: field.group_key || "details", order: field.sort_order ?? field.display_order ?? index, required: field.is_required, posting: field.is_active, filter: field.is_filterable || filterKeys.has(field.field_key), card: false, detail: true, active: field.is_active })) });
  }

  const localizedNodes = allNodes.map((node) => ({ ...node, id: Number(node.id), level: Number(node.level), name: localizeCategoryName({ locale, fallbackName: node.name, path: node.path }) }));

  return <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" dir={locale === "en" ? "ltr" : "rtl"}>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="font-display text-3xl font-bold">{copy.title}</h1><p className="mt-1 text-[var(--ink-2)]">{copy.description}</p></div><Link href={localizePath("/admin/categories", locale)} className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold">{copy.back}</Link></div>
    {params.saved ? <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{copy.saved}</p> : null}
    {params.status_updated ? <p className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">{copy.statusUpdated}</p> : null}
    <CategoryNavigator nodes={localizedNodes} selectedId={selectedId} locale={locale} />
    <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--ink-2)]"><span>{copy.selected}: <strong>{selected?.path ?? copy.none}</strong></span><span>{copy.publishedVersion}: <strong>{published?.version ?? 0}</strong></span><span>{copy.historyRetained}: <strong>{history.length}</strong></span></div>
    {selected && config ? <div className="mt-6"><SchemaBuilder key={selectedId} initial={config} categoryNodeId={selectedId} version={published?.version ?? 0} locale={locale} /></div> : <p className="mt-6">{copy.selectToBegin}</p>}
  </main>;
}
