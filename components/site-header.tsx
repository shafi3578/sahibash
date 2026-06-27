import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { FloatingPostAdButton } from "@/components/floating-post-ad-button";
import { localizePath } from "@/lib/i18n/routing";

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
  const href = (path: string) => localizePath(path, locale);
  const guestPostAdHref = `${href("/login")}?redirect=${encodeURIComponent("/post-ad")}&reason=post`;
  let user: { id: string } | null = null;
  let isAdmin = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "admin";
    }
  } catch {
    user = null;
    isAdmin = false;
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[var(--brand)] text-[var(--ink-1)]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
          <Link href={href("/")} className="shrink-0 font-display text-2xl font-bold sm:text-3xl">Sahibash</Link>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <LanguageSwitcher locale={locale} label={t.header.language} />

            <Link href={user ? href("/post-ad") : guestPostAdHref} className="hidden whitespace-nowrap rounded-full bg-[var(--accent)] px-3 py-2 text-xs font-semibold leading-none text-white lg:inline-flex lg:text-sm">{t.header.postAd}</Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link href={href("/admin")} className="hidden whitespace-nowrap rounded-full border border-black/20 bg-white px-3 py-2 text-xs font-semibold leading-none sm:inline-flex sm:text-sm">{t.header.admin}</Link>
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
      <FloatingPostAdButton locale={locale} label={t.header.postAd} href={user ? href("/post-ad") : guestPostAdHref} />
    </>
  );
}
