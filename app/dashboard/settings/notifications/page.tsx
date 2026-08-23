import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveNotificationPreferencesAction } from "@/lib/actions/notification-preferences";
import { DASHBOARD_COPY } from "@/lib/i18n/dashboard-copy";
import { ACCOUNT_EXPERIENCE_COPY } from "@/lib/account/copy";

const NOTIFICATION_FIELDS = [
  "new_messages",
  "listing_moderation",
  "listing_expiry",
  "saved_search_matches",
  "saved_listing_changes",
] as const;

type NotificationField = (typeof NOTIFICATION_FIELDS)[number];
type NotificationPreferences = Partial<Record<NotificationField, boolean>>;

export default async function NotificationSettingsPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const copy = DASHBOARD_COPY[locale];
  const accountCopy = ACCOUNT_EXPERIENCE_COPY[locale];
  const supabase = await createSupabaseServerClient();
  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select(NOTIFICATION_FIELDS.join(","))
    .eq("user_id", user.id)
    .maybeSingle();
  const typedPrefs = (prefs ?? {}) as NotificationPreferences;
  const notificationLabels: Record<NotificationField, string> = {
    new_messages: copy.newMessages,
    listing_moderation: copy.moderation,
    listing_expiry: copy.expiry,
    saved_search_matches: copy.searchMatches,
    saved_listing_changes: copy.listingChanges,
  };

  return (
    <DashboardSection
      currentPath="/dashboard/settings"
      title={accountCopy.notifications}
      description={accountCopy.notificationsDescription}
    >
      <form action={saveNotificationPreferencesAction} className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <p className="font-semibold text-[var(--ink-1)]">{ui.dashboard.settingsNotificationsTitle}</p>
        <p className="mt-1 text-sm text-[var(--ink-2)]">{ui.dashboard.settingsNotificationsDescription}</p>
        <input type="hidden" name="locale" value={locale} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {NOTIFICATION_FIELDS.map((key) => (
            <label key={key} className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--line)] bg-white px-3 text-sm">
              <input type="checkbox" name={key} defaultChecked={typedPrefs[key] !== false} />
              {notificationLabels[key]}
            </label>
          ))}
        </div>
        <button className="mt-4 min-h-11 rounded-lg bg-[var(--ink-1)] px-4 text-sm font-semibold text-white">
          {copy.savePreferences}
        </button>
      </form>
    </DashboardSection>
  );
}
