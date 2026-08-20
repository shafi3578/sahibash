import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteSavedSearchAction } from "@/lib/actions/saved-searches";
import { updateWantedRequestStatusAction } from "@/lib/actions/liquidity";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { DASHBOARD_COPY } from "@/lib/i18n/dashboard-copy";
import { localizePath } from "@/lib/i18n/routing";

export default async function FavoriteSearchesPage() {
  const user = await requireUser();
  const { locale } = await getDictionary();
  const ui = getUiTranslations(locale);
  const copy = DASHBOARD_COPY[locale];
  const supabase = await createSupabaseServerClient();
  const { data: searches } = await supabase.from("saved_searches").select("id,name,filters,notifications_enabled,created_at").eq("user_id",user.id).order("updated_at",{ascending:false});
  const { data: wantedRequests } = await supabase
    .from("wanted_requests")
    .select("id,title,status,urgency,query_text,province,district,notification_channels,match_count,created_at,attributes")
    .eq("user_id", user.id)
    .neq("status", "deleted")
    .order("updated_at", { ascending: false });

  return (
    <DashboardSection
      currentPath="/dashboard/favorite-searches"
      title={ui.dashboard.favoriteSearches}
      description={ui.dashboard.favoriteSearchesDescription}
    >
      <div className="mb-6 rounded-2xl border border-[var(--line)] bg-white p-4">
        <h2 className="font-semibold text-[var(--ink-1)]">
          {locale === "fa" ? "درخواست‌های «برایم پیدا کن»" : locale === "ps" ? "د «راته یې پیدا کړئ» غوښتنې" : "Find It For Me requests"}
        </h2>
        {!wantedRequests?.length ? (
          <p className="mt-2 text-sm text-[var(--ink-2)]">
            {locale === "fa"
              ? "وقتی نتیجه مناسب پیدا نشد، از صفحه جستجو یک درخواست بسازید."
              : locale === "ps"
                ? "کله چې ښه نتیجه نه وي، د لټون له پاڼې غوښتنه جوړه کړئ."
                : "When search is weak, create a request from the search page."}
          </p>
        ) : (
          <div className="mt-3 grid gap-3">
            {wantedRequests.map((request) => {
              const filters = (request.attributes ?? {}) as Record<string, string>;
              const query = new URLSearchParams(filters).toString();
              const isPaused = request.status === "paused";
              return (
                <article key={request.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link href={localizePath(query ? `/search?${query}` : "/search", locale)} className="min-w-0">
                      <p className="truncate font-semibold">{request.title}</p>
                      <p className="mt-1 text-xs text-[var(--ink-2)]">
                        {request.status} · {request.urgency} · {request.match_count ?? 0} matches
                      </p>
                    </Link>
                    <div className="flex flex-wrap gap-2">
                      <form action={updateWantedRequestStatusAction.bind(null, request.id, isPaused ? "active" : "paused")}>
                        <button className="min-h-10 rounded-lg border border-[var(--line)] bg-white px-3 text-sm">
                          {isPaused
                            ? locale === "fa" ? "فعال‌سازی" : locale === "ps" ? "فعالول" : "Resume"
                            : locale === "fa" ? "توقف" : locale === "ps" ? "درول" : "Pause"}
                        </button>
                      </form>
                      <form action={updateWantedRequestStatusAction.bind(null, request.id, "deleted")}>
                        <button className="min-h-10 rounded-lg border border-red-200 bg-white px-3 text-sm text-red-700">
                          {copy.delete}
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {!searches?.length ? <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5">
        <p className="font-semibold text-[var(--ink-1)]">{copy.noSavedSearches}</p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          {copy.savedSearchHelp}
        </p>
      </div> : <div className="grid gap-3">{searches.map(search => {
        const query = new URLSearchParams(Object.entries((search.filters ?? {}) as Record<string,string>)).toString();
        return <article key={search.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-4">
          <Link href={localizePath(`/search?${query}`, locale)} className="min-w-0 flex-1"><p className="truncate font-semibold">{search.name}</p><p className="mt-1 text-xs text-[var(--ink-2)]">{search.notifications_enabled ? copy.alertsEnabled : copy.alertsDisabled}</p></Link>
          <form action={deleteSavedSearchAction.bind(null,search.id)}><button className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-sm">{copy.delete}</button></form>
        </article>;
      })}</div>}
    </DashboardSection>
  );
}
