import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { LanguageSwitcher } from "@/components/language-switcher";
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
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[var(--brand)] text-[var(--ink-1)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link href={href("/")} className="font-display text-3xl font-bold">Sahibash</Link>
        <div className="flex items-center gap-2">
          <LanguageSwitcher locale={locale} label={t.header.language} />

          <Link href={href("/post-ad")} className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">{t.header.postAd}</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href={href("/admin")} className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.admin}</Link>
              )}
              <Link href={href("/dashboard")} className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.myProfile}</Link>
              <form action={signOutAction}><button className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.logout}</button></form>
            </>
          ) : (
            <>
              <Link href={href("/login")} className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.login}</Link>
              <Link href={href("/register")} className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.register}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
