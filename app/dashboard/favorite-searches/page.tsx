import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteSavedSearchAction } from "@/lib/actions/saved-searches";
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

  return (
    <DashboardSection
      currentPath="/dashboard/favorite-searches"
      title={ui.dashboard.favoriteSearches}
      description={ui.dashboard.favoriteSearchesDescription}
    >
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
