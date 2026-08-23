import Link from "next/link";
import { getDictionary } from "@/lib/i18n/server";
import { MobileSearchSheet } from "@/components/mobile-search-sheet";
import { localizePath } from "@/lib/i18n/routing";
import { getNavigationItems } from "@/lib/actions/navigation";
import { getSiteSettings } from "@/lib/actions/site-settings";
import { localizeNavigationLabel } from "@/lib/i18n/navigation-labels";
import { getLocalizedBrandName } from "@/lib/i18n/brand";
import { getCurrentUser } from "@/lib/auth";
import { buildLoginRedirectHref } from "@/lib/account/navigation";

function HeaderIcon({ name }: { name: "bell" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {name === "bell" ? <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></> : null}
    </svg>
  );
}

async function signOutAction() {
  "use server";
  try {
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
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
  const guestPostAdHref = buildLoginRedirectHref({ targetPath: postAdCreatePath, locale, reason: "post" });
  const mobileLabels = locale === "fa"
    ? { notifications: "اعلان‌ها" }
    : locale === "ps"
      ? { notifications: "خبرتیاوې" }
      : { notifications: "Notifications" };
  const user = await getCurrentUser();

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
            <Link href={user ? href("/dashboard/messages") : href("/login")} aria-label={mobileLabels.notifications} className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[var(--ink-1)] lg:hidden">
              <HeaderIcon name="bell" />
            </Link>
            <MobileSearchSheet locale={locale} />

            <Link href={user ? href(postAdCreatePath) : guestPostAdHref} className="hidden whitespace-nowrap rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold leading-none text-white lg:inline-flex lg:text-sm">{t.header.postAd}</Link>
            {user ? (
              <>
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
