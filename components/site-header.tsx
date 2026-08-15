import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FloatingPostAdButton } from "@/components/floating-post-ad-button";
import { localizePath } from "@/lib/i18n/routing";
import { getNavigationItems } from "@/lib/actions/navigation";
import { getSiteSettings } from "@/lib/actions/site-settings";

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
  const navigationItems = await getNavigationItems();
  const href = (path: string) => localizePath(path, locale);
  const postAdCreatePath = "/post-ad/create?posting=sell";
  const guestPostAdHref = `${href("/login")}?redirect=${encodeURIComponent(postAdCreatePath)}&reason=post`;
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
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href={href("/")} className="shrink-0 font-display text-2xl font-bold sm:text-3xl">{siteSettings.site_name}</Link>
          <nav className="hidden flex-1 items-center justify-center gap-2 lg:flex">
            {navigationItems.map((link) => (
              <Link key={`${link.id}-${link.path}`} href={href(link.path)} className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-sm font-semibold text-[var(--ink-1)]">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <LanguageSwitcher locale={locale} label={t.header.language} />

            <Link href={user ? href(postAdCreatePath) : guestPostAdHref} className="hidden whitespace-nowrap rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold leading-none text-white lg:inline-flex lg:text-sm">{t.header.postAd}</Link>
            {user ? (
              <>
                {canModerateListings && (
                  <Link href={href("/admin")} className="hidden whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:inline-flex sm:text-sm">{t.header.admin}</Link>
                )}
                {canManageAdministratorArea && (
                  <Link href={href("/administrator")} className="hidden whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:inline-flex sm:text-sm">Administrator</Link>
                )}
                <Link href={href("/dashboard")} className="min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm">{t.header.myProfile}</Link>
                <form action={signOutAction}><button className="min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm">{t.header.logout}</button></form>
              </>
            ) : (
              <>
                <Link href={href("/login")} className="min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm">{t.header.login}</Link>
                <Link href={href("/register")} className="min-w-0 whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:text-sm">{t.header.register}</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <FloatingPostAdButton locale={locale} label={t.header.postAd} href={user ? href(postAdCreatePath) : guestPostAdHref} />
    </>
  );
}
