import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { localizePath } from "@/lib/i18n/routing";
import { getNavigationItems } from "@/lib/actions/navigation";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { localizeNavigationLabel } from "@/lib/i18n/navigation-labels";
import { getLocalizedBrandName } from "@/lib/i18n/brand";

function HeaderIcon({ name }: { name: "search" | "bell" | "settings" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === "search" ? <><circle cx="10.8" cy="10.8" r="6.4" /><path d="m16.2 16.2 4.1 4.1" /></> : null}
      {name === "bell" ? <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></> : null}
      {name === "settings" ? <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V22h-4v-.4a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.2.1-2-3.4.1-.1A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.5-1H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V2h4v.4a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.2-.1 2 3.4-.1.1A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></> : null}
    </svg>
  );
}

async function signOutAction() {
  "use server";
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // no-op
  }
}

export async function SiteHeader() {
  const { locale, t } = await getDictionary();
  const siteSettings = await getSiteSettings();
  const brandName = getLocalizedBrandName(locale, siteSettings.site_name);
  const navigationItems = await getNavigationItems();
  const href = (path: string) => localizePath(path, locale);
  const postAdCreatePath = "/post-ad/create?posting=sell";
  const guestPostAdHref = `${href("/login")}?redirect=${encodeURIComponent(postAdCreatePath)}&reason=post`;
  const mobileLabels = locale === "fa"
    ? { notifications: "اعلان‌ها", search: "جستجو", settings: "تنظیمات" }
    : locale === "ps"
      ? { notifications: "خبرتیاوې", search: "لټون", settings: "تنظیمات" }
      : { notifications: "Notifications", search: "Search", settings: "Settings" };
  let user: { id: string } | null = null;
  let canModerateListings = false;
  let canManageAdministratorArea = false;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const [{ data: moderateData, error: moderateError }, { data: adminData, error: adminError }] = await Promise.all([
        supabase.rpc("has_admin_permission", {
          uid: user.id,
          permission_key: "listings.moderate",
        }),
        supabase.rpc("has_admin_permission", {
          uid: user.id,
          permission_key: "roles.manage",
        }),
      ]);

      canModerateListings = !moderateError && moderateData === true;
      canManageAdministratorArea = !adminError && adminData === true;
    }
  } catch {
    user = null;
    canModerateListings = false;
    canManageAdministratorArea = false;
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[var(--brand)] text-[var(--ink-1)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-4 lg:px-8">
          <Link href={href("/")} className="shrink-0 font-display text-2xl font-black tracking-tight sm:text-3xl">{brandName}</Link>
          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {navigationItems.map((link) => (
              <Link key={`${link.id}-${link.path}`} href={href(link.path)} className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-semibold text-[var(--ink-1)]">
                {localizeNavigationLabel(link.path, link.label, locale)}
              </Link>
            ))}
          </nav>
          <div className="flex min-w-0 items-center justify-end gap-1.5 sm:gap-2">
            <div className="hidden lg:block">
              <LanguageSwitcher locale={locale} label={t.header.language} />
            </div>
            <Link href={user ? href("/dashboard/messages") : href("/login")} aria-label={mobileLabels.notifications} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[var(--ink-1)] lg:hidden">
              <HeaderIcon name="bell" />
            </Link>
            <Link href={href("/search")} aria-label={mobileLabels.search} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[var(--ink-1)] lg:hidden">
              <HeaderIcon name="search" />
            </Link>
            <Link href={user ? href("/dashboard/settings") : href("/login")} aria-label={mobileLabels.settings} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[var(--ink-1)] lg:hidden">
              <HeaderIcon name="settings" />
            </Link>

            <Link href={user ? href(postAdCreatePath) : guestPostAdHref} className="hidden whitespace-nowrap rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold leading-none text-white lg:inline-flex lg:text-sm">{t.header.postAd}</Link>
            {user ? (
              <>
                {canModerateListings && (
                  <Link href={href("/admin")} className="hidden whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:inline-flex sm:text-sm">{t.header.admin}</Link>
                )}
                {canManageAdministratorArea && (
                  <Link href={href("/administrator")} className="hidden whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:inline-flex sm:text-sm">{t.header.admin}</Link>
                )}
                <Link href={href("/dashboard")} className="hidden min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm lg:inline-flex">{t.header.myProfile}</Link>
                <form action={signOutAction} className="hidden lg:block"><button className="min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm">{t.header.logout}</button></form>
              </>
            ) : (
              <>
                <Link href={href("/login")} className="hidden min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm lg:inline-flex">{t.header.login}</Link>
                <Link href={href("/register")} className="hidden min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm lg:inline-flex">{t.header.register}</Link>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
