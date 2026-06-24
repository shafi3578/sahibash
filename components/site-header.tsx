import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

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
        <Link href="/" className="font-display text-3xl font-bold">Sahibash</Link>
        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 rounded-full border border-black/20 bg-white px-2 py-1 text-xs font-semibold sm:flex">
            <span className="px-1 text-[var(--ink-2)]">{t.header.language}:</span>
            <Link href="/locale?locale=en" className={`rounded-full px-2 py-1 ${locale === "en" ? "bg-[var(--ink-1)] text-white" : ""}`}>EN</Link>
            <Link href="/locale?locale=fa" className={`rounded-full px-2 py-1 ${locale === "fa" ? "bg-[var(--ink-1)] text-white" : ""}`}>دری</Link>
            <Link href="/locale?locale=ps" className={`rounded-full px-2 py-1 ${locale === "ps" ? "bg-[var(--ink-1)] text-white" : ""}`}>پښتو</Link>
          </nav>

          <Link href="/post-ad" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white">{t.header.postAd}</Link>
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin" className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.admin}</Link>
              )}
              <Link href="/dashboard" className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.myProfile}</Link>
              <form action={signOutAction}><button className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.logout}</button></form>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.login}</Link>
              <Link href="/register" className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-semibold">{t.header.register}</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
