import { requireAdmin } from "@/lib/auth";
import {
  adminApproveSearchAliasAction,
  adminCreateSearchAliasAction,
  adminDeleteSearchAliasAction,
  adminToggleSearchAliasAction,
  adminUpdateSearchAliasAction,
} from "@/lib/actions/search-admin";
import {
  getSearchAliasDictionaryAdminRows,
  getSearchTelemetryAdminSnapshot,
} from "@/lib/data/search-admin";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";

export default async function AdminSearchPage() {
  await requireAdmin();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const [aliases, telemetry] = await Promise.all([
    getSearchAliasDictionaryAdminRows(),
    getSearchTelemetryAdminSnapshot(),
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-bold">{ui.admin.searchSystemAdmin}</h1>
      <p className="mt-1 text-[var(--ink-2)]">{ui.admin.searchAdminDescription}</p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <p className="text-sm text-[var(--ink-2)]">{ui.admin.totalSearches}</p>
          <p className="text-2xl font-bold">{telemetry.totals.totalSearches}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <p className="text-sm text-[var(--ink-2)]">{ui.admin.zeroResultSearches}</p>
          <p className="text-2xl font-bold">{telemetry.totals.zeroResultSearches}</p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <p className="text-sm text-[var(--ink-2)]">{ui.admin.resultsButNoClick}</p>
          <p className="text-2xl font-bold">{telemetry.totals.withResultsNoClicks}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.createAlias}</h2>
          <form action={adminCreateSearchAliasAction} className="mt-3 grid gap-3">
            <input name="canonical_term" placeholder={ui.admin.canonicalTerm} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <input name="aliases" placeholder={ui.admin.aliasesCommaSeparated} required className="rounded-xl border border-[var(--line)] px-3 py-2" />
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="language" defaultValue="multi" className="rounded-xl border border-[var(--line)] px-3 py-2">
                <option value="multi">{ui.admin.multiLanguage}</option>
                <option value="en">en</option>
                <option value="fa">fa</option>
                <option value="ps">ps</option>
              </select>
              <input name="category_scope" placeholder={ui.admin.categoryScopeOptional} className="rounded-xl border border-[var(--line)] px-3 py-2" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input type="checkbox" name="is_active" defaultChecked className="h-4 w-4" /> {ui.admin.active}
            </label>
            <button className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white">{ui.admin.saveAlias}</button>
          </form>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.suggestedNewAliases}</h2>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{ui.admin.suggestedAliasesDescription}</p>
          <ul className="mt-3 space-y-2 text-sm">
            {telemetry.suggestedAliases.length === 0 ? (
              <li className="rounded-lg border border-[var(--line)] p-2 text-[var(--ink-2)]">{ui.admin.noSuggestionsYet}</li>
            ) : telemetry.suggestedAliases.map((entry) => (
              <li key={`suggest-${entry.term}`} className="rounded-lg border border-[var(--line)] p-2">
                <div className="flex items-center justify-between">
                  <span>{entry.term}</span>
                  <span className="text-xs text-[var(--ink-2)]">{entry.count}</span>
                </div>
                <form action={adminCreateSearchAliasAction} className="mt-2 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-[var(--ink-2)]">
                    {ui.admin.canonical}
                    <input
                      name="canonical_term"
                      defaultValue={entry.term}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-[var(--ink-2)]">
                    {ui.admin.aliasesCommaSeparated}
                    <input
                      name="aliases"
                      defaultValue={entry.term}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs font-semibold text-[var(--ink-2)]">
                    {ui.admin.language}
                    <select name="language" defaultValue="multi" className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1 text-sm">
                      <option value="multi">{ui.admin.multiLanguage}</option>
                      <option value="en">en</option>
                      <option value="fa">fa</option>
                      <option value="ps">ps</option>
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-[var(--ink-2)]">
                    {ui.admin.categoryScopeOptional}
                    <input
                      name="category_scope"
                      placeholder={ui.admin.categoryScopeOptional}
                      className="mt-1 w-full rounded-lg border border-[var(--line)] px-2 py-1 text-sm"
                    />
                  </label>
                  <div className="sm:col-span-2 flex items-center gap-2">
                    <input type="hidden" name="is_active" value="true" />
                    <button className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-xs font-semibold">
                      {ui.admin.saveAliasRule}
                    </button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-display text-xl font-bold">{ui.admin.aliasDictionary}</h2>
        <div className="mt-4 space-y-3">
          {aliases.map((row) => (
            <form key={row.id} action={adminUpdateSearchAliasAction} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
              <input type="hidden" name="id" value={row.id} />
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                <input name="canonical_term" defaultValue={row.canonical_term} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <input name="aliases" defaultValue={row.aliases.join(", ")} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <select name="language" defaultValue={row.language} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm">
                  <option value="multi">{ui.admin.multiLanguage}</option>
                  <option value="en">en</option>
                  <option value="fa">fa</option>
                  <option value="ps">ps</option>
                </select>
                <input name="category_scope" defaultValue={row.category_scope ?? ""} className="rounded-lg border border-[var(--line)] px-2 py-1 text-sm" />
                <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-sm font-semibold">
                  <input type="checkbox" name="is_active" defaultChecked={row.is_active} className="h-4 w-4" /> {ui.admin.active}
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="rounded-lg bg-[var(--ink-1)] px-3 py-1.5 text-xs font-semibold text-white">{ui.admin.update}</button>
                <button
                  formAction={adminApproveSearchAliasAction}
                  className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  {ui.admin.approve}
                </button>
                <button
                  formAction={adminToggleSearchAliasAction}
                  name="next_active"
                  value={row.is_active ? "false" : "true"}
                  className="rounded-lg border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-semibold"
                >
                  {row.is_active ? ui.admin.disable : ui.admin.enable}
                </button>
                <button
                  formAction={adminDeleteSearchAliasAction}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700"
                >
                  {ui.admin.delete}
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--ink-2)]">
                {ui.admin.approvedBy}: {row.approved_by ?? ui.admin.notApproved} | {ui.admin.updated}: {new Date(row.updated_at).toLocaleString(locale === "en" ? "en-US" : locale === "fa" ? "fa-AF" : "ps-AF")}
              </p>
            </form>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.topZeroResultQueries}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {telemetry.topZeroResultQueries.map((entry) => (
              <li key={`zero-${entry.term}`} className="flex items-center justify-between rounded-lg border border-[var(--line)] p-2">
                <span>{entry.term}</span>
                <span className="text-xs text-[var(--ink-2)]">{entry.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.topSearchedTerms}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {telemetry.topSearchedTerms.map((entry) => (
              <li key={`searched-${entry.term}`} className="flex items-center justify-between rounded-lg border border-[var(--line)] p-2">
                <span>{entry.term}</span>
                <span className="text-xs text-[var(--ink-2)]">{entry.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.topRewrittenAliases}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {telemetry.topRewrittenAliases.map((entry) => (
              <li key={`rewritten-${entry.term}`} className="flex items-center justify-between rounded-lg border border-[var(--line)] p-2">
                <span>{entry.term}</span>
                <span className="text-xs text-[var(--ink-2)]">{entry.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-[var(--line)] bg-white p-4">
          <h2 className="font-display text-xl font-bold">{ui.admin.searchesWithResultsNoClick}</h2>
          <ul className="mt-3 max-h-96 space-y-2 overflow-auto text-xs">
            {telemetry.searchesWithResultsNoClicks.map((row) => (
              <li key={row.id} className="rounded-lg border border-[var(--line)] p-2">
                <p className="font-semibold">{row.query_text || row.normalized_query}</p>
                <p className="text-[var(--ink-2)]">language={row.selected_language} results={row.result_count}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
