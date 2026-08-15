import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveNotificationPreferencesAction } from "@/lib/actions/notification-preferences";

export default async function SettingsPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const supabase=await createSupabaseServerClient(); const {data:prefs}=await supabase.from("notification_preferences").select("*").eq("user_id",user.id).maybeSingle();

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title={ui.dashboard.settings}
      description={ui.dashboard.settingsDescription}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="font-semibold text-[var(--ink-1)]">{ui.dashboard.settingsLanguageTitle}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{ui.dashboard.settingsLanguageDescription}</p>
        </div>
        <form action={saveNotificationPreferencesAction} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
          <p className="font-semibold text-[var(--ink-1)]">{ui.dashboard.settingsNotificationsTitle}</p>
          <p className="mt-1 text-sm text-[var(--ink-2)]">{ui.dashboard.settingsNotificationsDescription}</p>
          <input type="hidden" name="locale" value={locale}/><div className="mt-4 grid gap-3 sm:grid-cols-2">{[["new_messages","New messages"],["listing_moderation","Approval or changes requested"],["listing_expiry","Listing expiry reminders"],["saved_search_matches","Saved-search matches"],["saved_listing_changes","Saved-listing changes"]].map(([key,label])=><label key={key} className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--line)] bg-white px-3 text-sm"><input type="checkbox" name={key} defaultChecked={prefs?prefs[key]!==false:true}/>{label}</label>)}</div><button className="mt-4 min-h-11 rounded-lg bg-[var(--ink-1)] px-4 text-sm font-semibold text-white">Save preferences</button>
        </form>
      </div>
    </DashboardSection>
  );
}
