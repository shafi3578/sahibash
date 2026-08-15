import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteSavedSearchAction } from "@/lib/actions/saved-searches";
import Link from "next/link";

export default async function FavoriteSearchesPage() {
  const user = await requireUser();
  const supabase = await createSupabaseServerClient();
  const { data: searches } = await supabase.from("saved_searches").select("id,name,filters,notifications_enabled,created_at").eq("user_id",user.id).order("updated_at",{ascending:false});

  return (
    <DashboardSection
      currentPath="/dashboard/favorite-searches"
      title="Favorite Searches"
      description="Save search filters and enable notifications for matching new listings."
    >
      {!searches?.length ? <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface-2)] p-5">
        <p className="font-semibold text-[var(--ink-1)]">No saved searches yet</p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">
          Search presets will appear here after you save a search from the listings page.
        </p>
      </div> : <div className="grid gap-3">{searches.map(search => {
        const query = new URLSearchParams(Object.entries((search.filters ?? {}) as Record<string,string>)).toString();
        return <article key={search.id} className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-4">
          <Link href={`/search?${query}`} className="min-w-0 flex-1"><p className="truncate font-semibold">{search.name}</p><p className="mt-1 text-xs text-[var(--ink-2)]">{search.notifications_enabled ? "Alerts enabled" : "Alerts disabled"}</p></Link>
          <form action={deleteSavedSearchAction.bind(null,search.id)}><button className="min-h-11 rounded-lg border border-[var(--line)] px-3 text-sm">Delete</button></form>
        </article>;
      })}</div>}
    </DashboardSection>
  );
}
