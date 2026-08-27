import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DashboardSection } from "@/components/dashboard-section";
import { getCurrentLocale } from "@/lib/i18n/server";
import { getUiTranslations } from "@/lib/i18n/ui";
import { localizePath } from "@/lib/i18n/routing";
import { formatDate, formatNumber } from "@/lib/i18n/format";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACCOUNT_EXPERIENCE_COPY } from "@/lib/account/copy";
import { LogoutForm } from "@/components/account/logout-form";

type ProfileSummary = {
  full_name: string | null;
  phone: string | null;
  preferred_language: string | null;
  created_at: string | null;
};

function countValue(value: number | null) {
  return typeof value === "number" ? value : 0;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const locale = await getCurrentLocale();
  const ui = getUiTranslations(locale);
  const copy = ACCOUNT_EXPERIENCE_COPY[locale];
  const supabase = await createSupabaseServerClient();

  const [
    profileResult,
    activeListingsResult,
    inactiveListingsResult,
    favoritesResult,
    savedSearchesResult,
    unreadMessagesResult,
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, phone, preferred_language, created_at").eq("id", user.id).maybeSingle(),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "approved"),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "approved"),
    supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_user_id", user.id).eq("status", "sent"),
  ]);

  const profile = (profileResult.data ?? null) as ProfileSummary | null;
  const displayName = profile?.full_name || user.email?.split("@")[0] || ui.dashboard.myAccount;
  const memberSince = profile?.created_at
    ? formatDate(profile.created_at, locale, { dateStyle: "medium" })
    : "—";

  const stats = [
    { label: copy.activeAds, value: countValue(activeListingsResult.count), href: "/dashboard/my-ads?tab=active" },
    { label: copy.inactiveAds, value: countValue(inactiveListingsResult.count), href: "/dashboard/my-ads?tab=inactive" },
    { label: copy.favorites, value: countValue(favoritesResult.count), href: "/dashboard/favorites" },
    { label: copy.savedSearches, value: countValue(savedSearchesResult.count), href: "/dashboard/favorite-searches" },
    { label: copy.unreadMessages, value: countValue(unreadMessagesResult.count), href: "/dashboard/messages" },
  ];

  const sections = [
    { title: ui.dashboard.myListings, description: ui.dashboard.myListingsDescription, href: "/dashboard/my-ads" },
    { title: ui.dashboard.favoriteListings, description: ui.dashboard.favoriteListingsDescription, href: "/dashboard/favorites" },
    { title: ui.dashboard.favoriteSearches, description: ui.dashboard.favoriteSearchesDescription, href: "/dashboard/favorite-searches" },
    { title: ui.dashboard.messages, description: ui.dashboard.messagesDescription, href: "/dashboard/messages" },
    { title: ui.dashboard.offers, description: ui.dashboard.offersDescription, href: "/dashboard/offers" },
    { title: copy.settingsHubTitle, description: copy.settingsHubDescription, href: "/dashboard/settings" },
    { title: copy.safety, description: copy.safetyDescription, href: "/dashboard/safety" },
    { title: ui.dashboard.helpCenter, description: ui.dashboard.helpCenterDescription, href: "/dashboard/help" },
  ];

  return (
    <DashboardSection
      currentPath="/dashboard"
      title={ui.dashboard.myAccount}
      description={ui.dashboard.myAccountDescription}
    >
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[linear-gradient(135deg,#fff7ed,#ffffff_42%,#eef2ff)] p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent)]">{copy.overviewEyebrow}</p>
          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-black text-[var(--ink-1)]">{displayName}</h2>
              <p className="mt-1 text-sm text-[var(--ink-2)]">{copy.overviewDescription}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full bg-white px-3 py-1 text-[var(--ink-2)]">{copy.memberSince}: {memberSince}</span>
                <span className="rounded-full bg-white px-3 py-1 text-[var(--ink-2)]">{user.email ?? "—"}</span>
                <span className="rounded-full bg-white px-3 py-1 text-[var(--ink-2)]">{profile?.phone ? copy.verified : copy.notVerified}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={localizePath("/dashboard/account-information", locale)} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--ink-1)] px-4 text-sm font-bold text-white">
                {copy.profile}
              </Link>
              <LogoutForm locale={locale} label={copy.logout} />
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <Link key={stat.label} href={localizePath(stat.href, locale)} className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-2)]">{stat.label}</p>
              <p className="mt-2 font-display text-3xl font-black text-[var(--ink-1)]">{formatNumber(stat.value, locale)}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link key={section.href} href={localizePath(section.href, locale)} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4 transition hover:border-[var(--ink-1)] hover:bg-white">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-[var(--ink-1)]">{section.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">{section.description}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2 py-1 text-xs font-bold text-[var(--ink-2)] group-hover:bg-[var(--ink-1)] group-hover:text-white">
                  {copy.open}
                </span>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </DashboardSection>
  );
}
